/** @jsxImportSource @octane-xplat/macos-renderer */
import { useCallback, useContext } from 'octane'
import type { ShowToastFn, ToastOptions } from './props'
import { ToastViewportContext } from './toast-context'
import { FALLBACK_TOAST_VIEWPORT, dismissToast, pushToast, registerToastViewport, toastOnViewport, toastStore } from './toast-store'
import { ToastViewportSurface } from './toast-viewport.macos.tsrx'

let fallback: any = null

function ensureFallbackViewport(): void {
	if (fallback && !fallback.closed) return
	const present = (globalThis as any).__xplatAppKit?.presentSurface
	if (!present) throw new Error('AppKit host has no toast presenter')
	const unregister = registerToastViewport(FALLBACK_TOAST_VIEWPORT)
	try {
		// A zero-size coordinator root owns the four edge stacks and anchored
		// popovers; it closes with its window, releasing subscriptions/timers.
		const host = present({ kind: 'toast', modal: false, width: 0, maxHeight: 0,
			component: ToastViewportSurface, props: { viewportId: FALLBACK_TOAST_VIEWPORT } })

		fallback = host
		void host.closedPromise.then(() => {
			unregister()
			if (fallback === host) fallback = null
			for (const entry of toastStore.get()) if (toastOnViewport(entry, FALLBACK_TOAST_VIEWPORT)) dismissToast(entry.id, 'manual')
		})
	} catch (error) { unregister(); throw error }
}

export const showToast: ShowToastFn = (options: ToastOptions) => {
	ensureFallbackViewport()
	const id = pushToast(options, FALLBACK_TOAST_VIEWPORT)
	return () => dismissToast(id, 'manual')
}

export function useToast(): ShowToastFn @{
	const ctx = useContext(ToastViewportContext)
	return useCallback((options: ToastOptions) => {
		ensureFallbackViewport()
		const id = pushToast(options, ctx?.id ?? FALLBACK_TOAST_VIEWPORT)
		return () => dismissToast(id, 'manual')
	}, [ctx?.id])
}
