/** @jsxImportSource @xplat/macos/renderer */
import type { PopoverProps } from './props'
import { cx } from './cx'

export function Popover(props: PopoverProps) @{
	@if (props.open) {
		<flexboxlayout flexDirection="column" className={cx('vx-popover', props.className)} style={props.style}>
			{props.children}
		</flexboxlayout>
	}
}
