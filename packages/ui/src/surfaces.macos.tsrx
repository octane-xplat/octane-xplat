/** @jsxImportSource @octane-xplat/macos-renderer */
import type { OverlayProps, PopoverProps } from './props'
import { cx } from '@octane-xplat/lib'

export function Overlay(props: OverlayProps) @{
	@if (props.open) {
		<masonview display="flex" flexDirection="column" className={cx('vx-overlay', props.className)} style={props.style} accessibilityLabel={props.accessibilityLabel}>
			{props.children}
		</masonview>
	}
}

export function Popover(props: PopoverProps) @{
	@if (props.open) {
		<masonview display="flex" flexDirection="column" className={cx('vx-popover', props.className)} style={props.style}>
			{props.children}
		</masonview>
	}
}
