import { useCallback, useContext } from 'octane';
import { createRoot } from 'octane';
import type { ShowToastFn, ToastDismissFn, ToastOptions } from './props';
import { ToastViewportContext } from './toast-context';
import {
	FALLBACK_TOAST_VIEWPORT,
	dismissToast,
	pushToast,
	registerToastViewport,
} from './toast-store';

import { ToastViewportSurface } from './toast-viewport.web.tsrx';

let fallbackMounted = false;

/** Lazily mounts the fallback stack on document.body — the destination
 *  for toasts pushed outside any `ToastViewport` (`showToast`, or
 *  `useToast` outside a provider). Lifetime-of-app singleton. */
function ensureFallbackViewport(): void {
	if (fallbackMounted || typeof document === 'undefined') return;
	fallbackMounted = true;
	const container = document.createElement('div');
	container.setAttribute('data-xplat-toast-fallback', '');
	document.body.appendChild(container);
	registerToastViewport(FALLBACK_TOAST_VIEWPORT);
	createRoot(container).render(ToastViewportSurface as any, {
		viewportId: FALLBACK_TOAST_VIEWPORT,
		position: 'bottomEnd',
		maxVisible: 5,
		isTopLayer: true,
	});
}

/** Show a toast on the fallback stack (Astryx `useToast` fallback path,
 *  as a module-level function). Returns the toast's dismiss function. */
export const showToast: ShowToastFn = (options: ToastOptions): ToastDismissFn => {
	ensureFallbackViewport();
	const id = pushToast(options, FALLBACK_TOAST_VIEWPORT);
	return () => dismissToast(id, 'manual');
};

/** Imperative toast control (Astryx `useToast`), web leaf. Inside a
 *  `ToastViewport` the returned function routes to that stack; outside
 *  one it lands on the auto-mounted fallback stack, same as `showToast`. */
export function useToast(): ShowToastFn {
	const ctx = useContext(ToastViewportContext);
	return useCallback(
		(options: ToastOptions): ToastDismissFn => {
			ensureFallbackViewport();
			const id = pushToast(options, ctx?.id ?? FALLBACK_TOAST_VIEWPORT);
			return () => dismissToast(id, 'manual');
		},
		[ctx?.id],
	);
}
