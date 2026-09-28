/** @jsxImportSource @xplat/macos/renderer */
import type { ScreenProps } from './props'
import { cx } from './cx'

export function Screen(props: ScreenProps) @{
	<flexboxlayout
		id={props.id}
		flexDirection="column"
		className={cx('vx-screen', props.className)}
		style={props.style}
	>
		{props.children}
	</flexboxlayout>
}
