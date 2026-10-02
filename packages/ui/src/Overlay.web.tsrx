import { createPortal, useEffect, useRef } from 'octane';
import type { OverlayProps } from './props';
import { useThemeScheme } from './theme/theme-scheme';
import { cx } from './cx';
import { isolateModalFocus } from './modal-focus.web';

/** Renders an in-window overlay through the DOM renderer's body portal. */
export function Overlay(props: OverlayProps) @{
	const dark = useThemeScheme() === 'dark';
	const layer = useRef<HTMLDivElement | null>(null);
	const panel = useRef<HTMLDivElement | null>(null);
	const dismiss = useRef(props.onDismiss);
	dismiss.current = props.onDismiss;
	useEffect(() => {
		if (!props.open || !props.shadeCover || !layer.current || !panel.current) return;
		return isolateModalFocus(layer.current, panel.current, () => dismiss.current?.());
	}, [props.open, props.shadeCover]);

	@if (props.open) {
		<>{createPortal(
			<div ref={layer} className={cx('vx-overlay', dark && 'dark', props.className)} style={{ ...props.style, position: 'fixed', inset: 0 }} {...props.web}>
				@if (props.shadeCover) {
					<div className="vx-overlay-shade" onClick={props.onDismiss} />
				}
				<div ref={panel} role={props.shadeCover ? 'dialog' : undefined} aria-modal={props.shadeCover ? true : undefined} aria-label={props.accessibilityLabel} className="vx-overlay-content" onClick={(event: any) => event.stopPropagation()}>
					{props.children}
				</div>
			</div>,
			document.body,
		)}</>
	}
}
