/** @jsxImportSource @nativescript-community/octane */
import type { ViewProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { glassClassOf, glassConfigOf } from './glass';
import { layoutChildProps } from './layout-child.native';
import { usePan } from './pan.native.tsrx';
/** Neutral flex-column container — flexboxlayout on native.
 *  Gesture props map 1:1 to NS gesture events (onPan → 'pan', etc.) —
 *  the driver's onX → eventName rule covers them generically. Payloads
 *  are normalized to the shared gesture shape (animation-gestures.md):
 *  { x, y, dx, dy, vx, vy, state: 'began'|'moved'|'ended'|'cancelled' }. */
export function View(props: ViewProps) @{
	<flexboxlayout
		id={props.id}
		{...layoutChildProps(props)}
		ref={(v: any) => { if (v) { applyEscapeProps(v, props); props.bind?.(v); } }}
		flexDirection="column"
		className={cx(glassClassOf(props.glass), props.className)}
		style={props.style}
		iosGlassEffect={glassConfigOf(props.glass)}
		onPan={usePan(props.onPan)}
		onSwipe={props.onSwipe}
	>
		{props.children}
	</flexboxlayout>
}
