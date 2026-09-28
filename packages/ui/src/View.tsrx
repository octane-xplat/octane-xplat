/** @jsxImportSource @nativescript-community/octane */
import type { ViewProps } from './props';
import { cx } from './cx';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';
import { layoutChildProps } from './layout-child';
import { usePan } from './pan.tsrx';
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
		className={cx(props.className)}
		style={props.style}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
		accessibilityLiveRegion={props.accessibilityLiveRegion as any}
		onPan={usePan(props.onPan)}
		onSwipe={props.onSwipe}
	>
		{props.children}
	</flexboxlayout>
}
