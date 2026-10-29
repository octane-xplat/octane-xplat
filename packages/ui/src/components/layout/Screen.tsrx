/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { ScreenProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'
import { registerRootLayout, unregisterRootLayout } from './root-layout'
import { attachTapToBlur } from '../../internal/keyboard/tap-to-blur'
// The screen shell is a RootLayout so RootLayout.open() can layer overlays
// over it (decision #22). Self-registers on loaded/unloaded — overlay and
// sheet services mount on the most recently mounted shell (topRootLayout).
// Both hosts use their assigned bounds without native safe-area adjustment.
// SafeArea owns padding; UIKit insets can still be stale on the first layout.
// Children go in a single inner column flexbox: RootLayout gives EVERY
// direct child the full root bounds — siblings stack in document order and
// a later sibling's invisible area eats taps meant for earlier ones
// (measured: pushed demo pages' header Row got the full 670pt root height,
// dead under the content View's overlap). One inner child = one bounds slot.
/**
 * Route-level container providing the screen's safe-area/status context. Import from `@octane-xplat/ui`.
 *
 * @see ScreenProps, SafeAreaProps.
 */
export function Screen(props: ScreenProps) @{
	<rootlayout
		iosIgnoreSafeArea={true}
		className="vx-screen-shell"
		id={props.id}
		ref={(v: any) => applyEscapeProps(v, props)}
		onLoaded={(e: any) => registerRootLayout(e.object)}
		onUnloaded={(e: any) => unregisterRootLayout(e.object)}
	>
		<masonview
			iosIgnoreSafeArea={true}
			className={cx('vx-screen-content', props.className)}
			style={mergeStyle({ display: 'flex' }, props.style)}
			ref={(v: any) => {
				if (v) {
					attachTapToBlur(v)
				}
			}}
		>
			{props.children}
		</masonview>
	</rootlayout>
}
