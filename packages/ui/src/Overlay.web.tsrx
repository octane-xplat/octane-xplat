import { createPortal } from 'octane';
import type { OverlayProps } from './props';
import { cx } from './cx';

/** Renders an in-window overlay through the DOM renderer's body portal. */
export function Overlay(props: OverlayProps) @{
	@if (props.open) {
		<>{createPortal(
			<div className={cx('vx-overlay', props.className)} style={{ ...props.style, position: 'fixed', inset: 0 }} {...props.web}>
				@if (props.shadeCover) {
					<div className="vx-overlay-shade" onClick={props.onDismiss} />
				}
				<div className="vx-overlay-content" onClick={(event: any) => event.stopPropagation()}>
					{props.children}
				</div>
			</div>,
			document.body,
		)}</>
	}
}
