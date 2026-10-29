import { useCallback, useContext } from 'octane'
import type { ComponentBody } from 'octane'
import { createRoot } from '../../routing/browser-root.web'
import type { ShowToastFn, ToastOptions } from '../../props'
import { ToastViewportContext } from './toast-context'
import {
	FALLBACK_TOAST_VIEWPORT,
	pushToast,
	registerToastViewport,
	toastHandleFor,
} from './toast-store'

import { ToastViewportSurface } from './toast-viewport.web.tsrx'

let fallbackMounted = false

/** Lazily mounts the fallback stack on document.body — the destination
 *  for toasts pushed outside any `ToastViewport` (`showToast`, or
 *  `useToast` outside a provider). Lifetime-of-app singleton. */
function ensureFallbackViewport(): void {
	if (fallbackMounted || typeof document === 'undefined') {
		return
	}

	fallbackMounted = true
	const container = document.createElement('div')
	container.setAttribute('data-xplat-toast-fallback', '')
	document.body.appendChild(container)
	registerToastViewport(FALLBACK_TOAST_VIEWPORT)
	createRoot(container).render(ToastViewportSurface as unknown as ComponentBody, {
		viewportId: FALLBACK_TOAST_VIEWPORT,
		position: 'bottomEnd',
		maxVisible: 5,
		isTopLayer: true,
	})
}

/** Show a toast on the fallback stack (Astryx `useToast` fallback path,
 *  as a module-level function). Returns the toast's handle — `null` when
 *  an 'ignore' collision suppressed it. */
export const showToast: ShowToastFn = (options: ToastOptions) => {
	ensureFallbackViewport()
	return toastHandleFor(pushToast(options, FALLBACK_TOAST_VIEWPORT))
}

/** Imperative toast control (Astryx `useToast`), web leaf. Inside a
 *  `ToastViewport` the returned function routes to that stack; outside
 *  one it lands on the auto-mounted fallback stack, same as `showToast`. */
export function useToast(): ShowToastFn {
	const ctx = useContext(ToastViewportContext)
	return useCallback(
		(options: ToastOptions) => {
			ensureFallbackViewport()
			return toastHandleFor(pushToast(options, ctx?.id ?? FALLBACK_TOAST_VIEWPORT))
		},
		[ctx?.id],
	)
}
