/** @jsxImportSource @nativescript-community/octane */
import { useCallback } from 'octane';
import type { ViewProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
/** Neutral flex-column container — flexboxlayout on native.
 *  Gesture props map 1:1 to NS gesture events (onPan → 'pan', etc.) —
 *  the driver's onX → eventName rule covers them generically. Payloads
 *  are normalized to the shared gesture shape (animation-gestures.md):
 *  { x, y, dx, dy, vx, vy, state: 'began'|'moved'|'ended'|'cancelled' }. */
const PAN_STATE = ['cancelled', 'began', 'moved', 'ended'] as const;

export function View(props: ViewProps) @{
	// Memoized so the driver's observer doesn't churn per render — each
	// re-subscribe would re-attach a UIPanGestureRecognizer.
	const onPan = useCallback((e: any) => props.onPan?.({
		// NS pan gives deltaX/deltaY + enum state; velocity needs the native
		// recognizer (e.ios.velocityInView) — v1 leaves it 0.
		x: e.deltaX, y: e.deltaY, dx: e.deltaX, dy: e.deltaY,
		vx: 0, vy: 0,
		state: PAN_STATE[e.state] ?? 'moved',
		target: e.view ?? e.object,
	}), [props.onPan]);

	<flexboxlayout
		id={props.id}
		ref={(v: any) => { if (v) { applyEscapeProps(v, props); props.bind?.(v); } }}
		flexDirection="column"
		className={cx(props.className)}
		style={props.style}
		onPan={props.onPan ? onPan : undefined}
		onSwipe={props.onSwipe}
	>
		{props.children}
	</flexboxlayout>
}
