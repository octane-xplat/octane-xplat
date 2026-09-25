/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane';
import type { ModalProps } from "./props";
import { Frame, GridLayout } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import { applyThemeClasses } from './theme/theme-scheme';

// The modal's content renders inside a separate Octane root on a GridLayout
// host — modals never share context with their presenter (decision #9).
// GridLayout because the root host must be multi-child: ContentView assigns
// each child to `.content`, so a fragment of siblings would keep only the
// last; grid children all fill the cell (single-child layout unchanged).
// Children arrive as an already-created element: element data evaluates in
// whichever root renders it, so re-parenting through the second root is safe.
function Panel(props: { children?: any }) @{
	<>{props.children}</>
}

/**
 * Modal — declarative `open` drives imperative `showModal`. Renders nothing
 * inline; the content lives on the modal's own root above the whole tree.
 */
export function Modal(props: ModalProps) @{
	const shown = useRef<{ host: GridLayout; root: any; unbindTheme?: () => void } | null>(null);

	useEffect(() => {
		if (props.open && !shown.current) {
			const presenter = (Frame.topmost()?.currentPage ?? Frame.topmost()) as any;
			if (!presenter) return;
			const host = new GridLayout();
			const unbindTheme = applyThemeClasses(host, 'vx-modal-host');
			const root = createNativeScriptRoot(host);
			shown.current = { host, root, unbindTheme };
			if (props.component) {
				root.render(props.component as UniversalComponent, props.params ?? {});
			} else {
				root.render(Panel as unknown as UniversalComponent, { children: props.children });
			}

			// Signature is showModal(viewToShow, options) — not an options bag.
			const fullscreen = props.presentation
				? props.presentation === 'fullscreen'
				: props.fullscreen ?? true;

			presenter.showModal(host, {
				context: {},
				closeCallback: (result?: unknown) => { shown.current?.unbindTheme?.(); shown.current = null; props.onClose?.(result); },
				fullscreen,
				animated: true,
			});
		} else if (!props.open && shown.current) {
			const { host } = shown.current;
			shown.current = null;
			host.closeModal();
		}
	}, [props.open]);

	<></>
}
