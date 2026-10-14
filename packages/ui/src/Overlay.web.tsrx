import { createPortal, useEffect, useRef, useState } from 'octane';
import type { OverlayProps } from './props';
import { useThemeScheme } from './theme/theme-scheme';
import { cx } from '@octane-xplat/lib';
import { isolateModalFocus } from './modal-focus.web';

/** Renders an in-window overlay through the DOM renderer's body portal. */
export function Overlay(props: OverlayProps) @{
	const dark = useThemeScheme() === 'dark';
	const layer = useRef<HTMLDivElement | null>(null);
	const panel = useRef<HTMLDivElement | null>(null);
	const [internal, setInternal] = useState(props.defaultOpen ?? false);
	const open = props.open ?? internal;
	const requestDismiss = () => {
		if (props.open === undefined) setInternal(false);
		props.onDismiss?.();
	};

	const dismiss = useRef(requestDismiss);
	dismiss.current = requestDismiss;
	useEffect(() => {
		if (!open || !props.shadeCover || !layer.current || !panel.current) return;
		return isolateModalFocus(layer.current, panel.current, () => dismiss.current?.());
	}, [open, props.shadeCover]);

	@if (open) {
		<>{createPortal(
			<div ref={layer} className={cx('vx-overlay', dark && 'dark', props.className)} style={{ ...(props.style as any), position: 'fixed', inset: 0 }} {...(props.web as any)}>
				@if (props.shadeCover) {
					<div className="vx-overlay-shade" onClick={requestDismiss} />
				}
				<div ref={panel} data-testid={props.testID} role={props.shadeCover ? 'dialog' : undefined} aria-modal={props.shadeCover ? true : undefined} aria-label={props.shadeCover ? props.accessibilityLabel : undefined} className="vx-overlay-content" onClick={(event: any) => event.stopPropagation()}>
					{props.children}
				</div>
			</div>,
			document.body,
		)}</>
	}
}
