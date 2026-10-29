/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { ViewProps } from '../../props'
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from '../overlays/escape-props'
import { layoutChildProps } from './layout-child'
import { usePan } from './pan'
/** Neutral flex-column container — flex-direction:column masonview on native.
 *  Gesture props map 1:1 to NS gesture events (onPan → 'pan', etc.) —
 *  the driver's onX → eventName rule covers them generically. Payloads
 *  are normalized to the shared gesture shape (animation-gestures.md):
 *  { x, y, dx, dy, vx, vy, state: 'began'|'moved'|'ended'|'cancelled' }. */
export function View(props: ViewProps) @{
	const forwardedRef = useMemo(
		() =>
			refList((v: any) => {
				if (v) {
					applyEscapeProps(v, props)
				}
			}, props.ref),
		[props.ref, props.ios, props.android, props.web],
	)

	<masonview
		id={props.id}
		testID={props.testID ?? ''}
		{...layoutChildProps(props, mergeStyle({ display: 'flex' }, props.style))}
		ref={forwardedRef}
		className={['vx-view', props.className]}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={nativeAccessibilityState(props.accessibilityState)}
		accessibilityLiveRegion={props.accessibilityLiveRegion}
		onPan={usePan(props.onPan)}
		onSwipe={props.onSwipe}
	>
		{props.children}
	</masonview>
}
