/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef, useState } from 'octane';
import type { UIModalProps } from "../props";
import { Frame, GridLayout } from '@nativescript/core';
import { createPortal } from '../native-portal';
import { applyThemeClasses } from '../theme/theme-host';
import { modalPresenter } from '../modal-presenter';

type ShownModal = { host: GridLayout; unbindTheme: () => void; finished: boolean };

/** UIModal — declarative `open` drives the platform modal presentation
 *  (`showModal`; fullscreen=false is an iOS form sheet). Renders nothing
 *  inline; children or `component` + `params` portal from the declaring tree
 *  into the modal host and retain its context. */
export function UIModal(props: UIModalProps) @{
	const shown = useRef<ShownModal | null>(null);
	const [portalHost, setPortalHost] = useState<GridLayout | null>(null);
	const [internal, setInternal] = useState(props.defaultOpen ?? false);
	const open = props.open ?? internal;
	const onClose = useRef(props.onClose);
	onClose.current = props.onClose;
	const controlled = useRef(props.open !== undefined);
	controlled.current = props.open !== undefined;
	const closed = (result?: unknown) => {
		if (!controlled.current) setInternal(false);
		onClose.current?.(result);
	};
	const finish = (instance: ShownModal, result?: unknown) => {
		if (instance.finished) return;
		instance.finished = true;
		instance.unbindTheme();
		instance.host.removeChildren?.();
		if (shown.current === instance) shown.current = null;
		setPortalHost((current) => current === instance.host ? null : current);
		closed(result);
	};

	useEffect(() => {
		if (open && !shown.current) {
			const presenter = modalPresenter(Frame.topmost());
			if (!presenter) {
				// Dropped, not deferred: the effect only re-runs when props
				// change, so warn loudly instead of silently swallowing open.
				console.warn('[Modal] open dropped — no live presenter (currentPage mid-navigation or no active frame).');
				return;
			}

			const host = new GridLayout();
			const unbindTheme = applyThemeClasses(host, 'vx-modal-host');
			const instance: ShownModal = {
				host,
				unbindTheme,
				finished: false,
			};
			shown.current = instance;
			setPortalHost(host);

			// Signature is showModal(viewToShow, options) — not an options bag.
			const fullscreen = props.presentation
				? props.presentation === 'fullscreen'
				: props.fullscreen ?? true;

			presenter.showModal(host, {
				context: {},
				closeCallback: (result?: unknown) => finish(instance, result),
				fullscreen,
				animated: true,
			});
		} else if (!open && shown.current) {
			const instance = shown.current;
			try {
				instance.host.closeModal();
			} catch {
				finish(instance);
			}
		}
	}, [open]);
	useEffect(() => () => {
		const instance = shown.current;
		if (!instance) return;
		shown.current = null;
		instance.finished = true;
		instance.unbindTheme();
		try {
			instance.host.closeModal();
		} catch {}
		instance.host.removeChildren?.();
	}, []);

	const Component = props.component
	const content = Component
		? <Component {...(props.params ?? {})} />
		: <>{props.children}</>;
	<>{portalHost ? createPortal(content, portalHost) : null}</>
}
