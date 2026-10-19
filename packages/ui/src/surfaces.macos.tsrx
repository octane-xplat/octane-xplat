/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import type { OverlayProps, PopoverProps } from './props'
import { cx } from '@octane-xplat/lib'

export function Overlay(props: OverlayProps) @{
	@if (props.open) {
		<masonview className={cx('vx-overlay', props.className)} style={mergeStyle({flexDirection: "column"}, mergeStyle({display: "flex"}, props.style))} accessibilityLabel={props.accessibilityLabel}>
			{props.children}
		</masonview>
	}
}

export function Popover(props: PopoverProps) @{
	@if (props.open) {
		<masonview className={cx('vx-popover', props.className)} style={mergeStyle({flexDirection: "column"}, mergeStyle({display: "flex"}, props.style))}>
			{props.children}
		</masonview>
	}
}
