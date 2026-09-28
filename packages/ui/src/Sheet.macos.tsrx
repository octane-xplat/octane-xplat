/** @jsxImportSource @xplat/macos/renderer */
import type { SheetProps } from './props'
import { cx } from './cx'

export function Sheet(props: SheetProps) @{
	@if (props.open) {
		<flexboxlayout
			flexDirection="column"
			className={cx('vx-sheet', props.className)}
			style={props.style}
		>
			{props.children}
		</flexboxlayout>
	}
}
