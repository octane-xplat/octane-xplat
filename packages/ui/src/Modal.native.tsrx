/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane';
import { ContentView, Frame } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';

// The modal's content renders inside a separate Octane root on a ContentView
// host — modals never share context with their presenter (decision #9).
// Children arrive as an already-created element: element data evaluates in
// whichever root renders it, so re-parenting through the second root is safe.
function Panel(props: { children?: any }) @{
	<>{props.children}</>
}

/**
 * Modal — declarative `open` drives imperative `showModal`. Renders nothing
 * inline; the content lives on the modal's own root above the whole tree.
 */
export function Modal(props: {
  open?: boolean;
  onClose?: () => void;
  fullscreen?: boolean;
  children?: any;
}) @{
	const shown = useRef<{ host: ContentView; root: any } | null>(null);

	useEffect(() => {
		if (props.open && !shown.current) {
			const presenter = (Frame.topmost()?.currentPage ?? Frame.topmost()) as any;
			if (!presenter) return;
			const host = new ContentView();
			const root = createNativeScriptRoot(host);
			shown.current = { host, root };
			root.render(Panel as unknown as UniversalComponent, { children: props.children });
			// Signature is showModal(viewToShow, options) — not an options bag.
			presenter.showModal(host, {
				context: {},
				closeCallback: () => { shown.current = null; props.onClose?.(); },
				fullscreen: props.fullscreen ?? true,
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
