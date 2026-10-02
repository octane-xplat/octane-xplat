/** @jsxImportSource @xplat/macos/renderer */
import type { DialogHeaderProps, DialogProps } from './props'
import { cx } from './cx'

/** macOS coverage is the inline panel rendering — the AppKit target has no
 *  shared in-window layer service yet (documented gap; Sheet's own macOS
 *  leaf renders the same way). `isOpen` gates mounting. */
export function Dialog(props: DialogProps) @{
	@if (props.isOpen) {
		<flexboxlayout
			flexDirection="column"
			className={cx('vx-dialog', props.variant === 'fullscreen' && 'vx-dialog--fullscreen', props.className)}
			style={props.style}
		>
			{props.children}
		</flexboxlayout>
	}
}

export function DialogHeader(props: DialogHeaderProps) @{
	<flexboxlayout flexDirection="column" className={cx('vx-dialog-header', props.className)} style={props.style}>
		<flexboxlayout flexDirection="row" alignItems="center">
			{props.startContent}
			<flexboxlayout flexDirection="column" flexGrow={1} className="vx-dialog-header-text">
				{props.title != null && <label className="vx-dialog-title">{props.title}</label>}
				{props.subtitle != null && <label className="vx-dialog-subtitle">{props.subtitle}</label>}
			</flexboxlayout>
			{props.endContent}
		</flexboxlayout>
	</flexboxlayout>
}
