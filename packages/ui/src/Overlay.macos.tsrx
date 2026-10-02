/** @jsxImportSource @octane-xplat/macos-renderer */
import type { OverlayProps } from './props'
import { cx } from './cx'

export function Overlay(props: OverlayProps) @{
	@if (props.open) {
		<flexboxlayout flexDirection="column" className={cx('vx-overlay', props.className)} style={props.style}>
			{props.children}
		</flexboxlayout>
	}
}
