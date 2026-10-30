/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { OverlayProps } from '../../props'
import { cx } from '@octane-xplat/lib'

export function Overlay(props: OverlayProps): unknown @{
	@if (props.open) {
		<masonview
			className={cx('vx-overlay', props.className)}
			style={mergeStyle({ flexDirection: 'column' }, mergeStyle({ display: 'flex' }, props.style))}
			accessibilityLabel={props.accessibilityLabel}
		>
			{props.children}
		</masonview>
	}
}
