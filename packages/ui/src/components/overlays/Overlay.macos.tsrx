/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useState } from 'octane'
import type { OverlayProps } from '../../props'
import { cx } from '@octane-xplat/lib'

export function Overlay(props: OverlayProps) @{
	const [internal] = useState(props.defaultOpen ?? false)
	const open = props.open ?? internal

	@if (open) {
		<masonview
			className={cx('vx-overlay', props.className)}
			style={mergeStyle({ flexDirection: 'column' }, mergeStyle({ display: 'flex' }, props.style))}
			accessibilityLabel={props.accessibilityLabel}
		>
			{props.children}
		</masonview>
	}
}
