/** @jsxImportSource @octane-xplat/macos-renderer */
import { useState } from 'octane'
import type { OverlayProps } from './props'
import { cx } from '@octane-xplat/lib'

export function Overlay(props: OverlayProps) @{
	const [internal] = useState(props.defaultOpen ?? false)
	const open = props.open ?? internal

	@if (open) {
		<flexboxlayout flexDirection="column" className={cx('vx-overlay', props.className)} style={props.style} accessibilityLabel={props.accessibilityLabel}>
			{props.children}
		</flexboxlayout>
	}
}
