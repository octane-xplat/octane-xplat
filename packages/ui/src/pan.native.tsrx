/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useRef } from 'octane';
import { Utils } from '@nativescript/core';
import type { PanEvent } from './props';

/** Shared pan normalization for native leaves — NS pan payloads
 *  ({deltaX,deltaY,state:int}) map to the shared gesture shape. Velocity:
 *  iOS reads velocityInView, Android feeds MotionEvents to VelocityTracker
 *  (dip/sec both). Returns undefined when no callback is set so leaves can
 *  spread it straight into the gesture prop. */
const PAN_STATE = ['cancelled', 'began', 'moved', 'ended'] as const;

function panVelocity(e: any, state: number, trackerRef: { current: any }): { vx: number; vy: number } {
	const recognizer = e.ios;
	const nativeView = e.view?.nativeViewProtected;
	if (recognizer?.velocityInView && nativeView) {
		const velocity = recognizer.velocityInView(nativeView);
		return { vx: velocity.x, vy: velocity.y };
	}

	// NativeScript's Android pan facade exposes the current MotionEvent but no
	// velocity. Feed those events to the platform tracker and convert px/sec to
	// the dip/sec units used by deltaX/deltaY.
	const motionEvent = e.android?.current;
	const velocityTrackerClass = (globalThis as any).android?.view?.VelocityTracker;
	if (!motionEvent || !velocityTrackerClass) {
		return { vx: 0, vy: 0 };
	}

	if (state === 1 || !trackerRef.current) {
		trackerRef.current?.recycle?.();
		trackerRef.current = velocityTrackerClass.obtain();
	}

	const tracker = trackerRef.current;
	tracker.addMovement(motionEvent);
	tracker.computeCurrentVelocity(1000);
	const density = Utils.layout.getDisplayDensity();
	const velocity = { vx: tracker.getXVelocity() / density, vy: tracker.getYVelocity() / density };
	if (state === 0 || state === 3) {
		tracker.recycle?.();
		trackerRef.current = null;
	}

	return velocity;
}

export function usePan(cb?: (e: PanEvent) => void): ((e: any) => void) | undefined {
	const velocityTracker = useRef<any>(null);
	// Memoized so the driver's observer doesn't churn per render — each
	// re-subscribe would re-attach a UIPanGestureRecognizer.
	const handler = useCallback((e: any) => {
		const state = PAN_STATE[e.state] ?? 'moved';
		const velocity = panVelocity(e, e.state, velocityTracker);
		cb?.({
			x: e.deltaX, y: e.deltaY, dx: e.deltaX, dy: e.deltaY,
			vx: velocity.vx, vy: velocity.vy,
			state,
			target: e.view ?? e.object,
		});
	}, [cb]);

	return cb ? handler : undefined;
}
