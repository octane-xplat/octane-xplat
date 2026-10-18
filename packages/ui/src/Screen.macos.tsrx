/** @jsxImportSource @octane-xplat/macos-renderer */
import type { ScreenProps } from './props'
import { cx } from '@octane-xplat/lib'

export function Screen(props: ScreenProps) @{
	<masonview display="flex" id={props.id} flexDirection="column" className={cx('vx-screen', props.className)} style={props.style}>
		{props.children}
	</masonview>
}
