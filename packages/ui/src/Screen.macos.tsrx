/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import type { ScreenProps } from './props'
import { cx } from '@octane-xplat/lib'

export function Screen(props: ScreenProps) @{
	<masonview id={props.id} flexDirection="column" className={cx('vx-screen', props.className)} style={mergeStyle({display: "flex"}, props.style)}>
		{props.children}
	</masonview>
}
