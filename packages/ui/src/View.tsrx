/** @jsxImportSource @nativescript-community/octane */
import { useMemo } from 'octane'
import { refList } from './ref-list'
import type { ViewProps } from './props';
import { cx } from './cx';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';
import { layoutChildProps } from './layout-child';
import { usePan } from './pan';
/** Neutral flex-column container — flexboxlayout on native.
 *  Gesture props map 1:1 to NS gesture events (onPan → 'pan', etc.) —
 *  the driver's onX → eventName rule covers them generically. Payloads
 *  are normalized to the shared gesture shape (animation-gestures.md):
 *  { x, y, dx, dy, vx, vy, state: 'began'|'moved'|'ended'|'cancelled' }. */
export function View(props: ViewProps) @{
	const forwardedRef = useMemo(() => refList((v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	<flexboxlayout
		id={props.id}
		testID={props.testID ?? ''}
		{...layoutChildProps(props)}
		ref={forwardedRef}
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
