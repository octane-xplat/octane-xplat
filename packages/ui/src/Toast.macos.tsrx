/** @jsxImportSource @xplat/macos/renderer */
import type { ToastProps, ToastType } from './props'
import { cx } from './cx'

/** Inline toast card, macOS leaf — the AppKit target has no toast stack
 *  service, so only the standalone card renders (same coverage class as
 *  the previous toast stub). Timers and swipe dismissal are N/A. */
export function Toast(props: ToastProps) @{
	const type: ToastType = props.type ?? 'info'

	<flexboxlayout
		flexDirection="row"
		alignItems="center"
		className={cx('vx-toast', type === 'error' && 'vx-toast--error', props.className)}
		style={props.style}
	>
		<flexboxlayout flexDirection="column" flexGrow={1} className="vx-toast-content">
			{typeof props.body === 'string' ? <label textWrap={true}>{props.body}</label> : props.body}
		</flexboxlayout>
		{props.endContent}
		{props.onDismiss != null && (
			<flexboxlayout className="vx-toast-close" onTap={() => props.onDismiss?.('manual')} />
		)}
	</flexboxlayout>
}
