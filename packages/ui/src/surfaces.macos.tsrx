/** @jsxImportSource @xplat/macos/renderer */
import type { OverlayProps, PopoverProps, SheetProps } from './props'
import { cx } from './cx'

export function Overlay(props: OverlayProps) @{
	@if (props.open) {
		<flexboxlayout flexDirection="column" className={cx('vx-overlay', props.className)} style={props.style}>
			{props.children}
		</flexboxlayout>
	}
}

export function Popover(props: PopoverProps) @{
	@if (props.open) {
		<flexboxlayout flexDirection="column" className={cx('vx-popover', props.className)} style={props.style}>
			{props.children}
		</flexboxlayout>
	}
}

export function Sheet(props: SheetProps) @{
	@if (props.open) {
		<flexboxlayout flexDirection="column" className={cx('vx-sheet', props.className)} style={props.style}>
			{props.children}
		</flexboxlayout>
	}
}
