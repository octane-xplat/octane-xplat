/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useRef } from 'octane';
import { Utils } from '@nativescript/core';
import type { ViewProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { glassClassOf, glassConfigOf } from './glass';
import { layoutChildProps } from './layout-child.native';
/** Neutral flex-column container — flexboxlayout on native.
 *  Gesture props map 1:1 to NS gesture events (onPan → 'pan', etc.) —
 *  the driver's onX → eventName rule covers them generically. Payloads
 *  are normalized to the shared gesture shape (animation-gestures.md):
 *  { x, y, dx, dy, vx, vy, state: 'began'|'moved'|'ended'|'cancelled' }. */
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

export function View(props: ViewProps) @{
	const velocityTracker = useRef<any>(null);
	// Memoized so the driver's observer doesn't churn per render — each
	// re-subscribe would re-attach a UIPanGestureRecognizer.
	const onPan = useCallback((e: any) => {
		const state = PAN_STATE[e.state] ?? 'moved';
		const velocity = panVelocity(e, e.state, velocityTracker);
		props.onPan?.({
			x: e.deltaX, y: e.deltaY, dx: e.deltaX, dy: e.deltaY,
			vx: velocity.vx, vy: velocity.vy,
			state,
			target: e.view ?? e.object,
		});
	}, [props.onPan]);

	<flexboxlayout
		id={props.id}
		{...layoutChildProps(props)}
		ref={(v: any) => { if (v) { applyEscapeProps(v, props); props.bind?.(v); } }}
		flexDirection="column"
		className={cx(glassClassOf(props.glass), props.className)}
		style={props.style}
		iosGlassEffect={glassConfigOf(props.glass)}
		onPan={props.onPan ? onPan : undefined}
		onSwipe={props.onSwipe}
	>
		{props.children}
	</flexboxlayout>
}
