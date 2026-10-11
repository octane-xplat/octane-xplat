/** @jsxImportSource @octane-xplat/macos-renderer */
import type { OverlayProps } from './props'
import { cx } from '@octane-xplat/lib'

export function Overlay(props: OverlayProps) @{
	@if (props.open) {
		<flexboxlayout flexDirection="column" className={cx('vx-overlay', props.className)} style={props.style} accessibilityLabel={props.accessibilityLabel}>
			{props.children}
		</flexboxlayout>
	}
}
