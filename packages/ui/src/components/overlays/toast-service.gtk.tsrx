/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useContext } from 'octane'
import { hostGlobal } from '../../internal/platform/host-bridge'
import type { ShowToastFn, ToastOptions, ToastPosition } from '../../props'
import { ToastViewportContext } from './toast-context'
import { FALLBACK_TOAST_VIEWPORT, pushToast, registerToastViewport, toastHandleFor } from './toast-store'
import { GtkToastSurface, TOAST_EDGE_ALIGN, TOAST_POSITIONS } from './toast-surface.gtk'

/** The fallback stack's dedicated universal root inside nonmodal overlay
 *  layers — mounted once on the first toast that has no declaring
 *  `ToastViewport`, unmounted with the owning app root's teardown. One
 *  corner-docked layer per edge; the service root itself sits inside the
 *  bottomEnd layer's target and portals each edge stack out. */
let fallback: { layers: Partial<Record<ToastPosition, any>>; unmount: () => void } | null = null

function ensureFallbackViewport(): void {
	if (fallback) {
		return
	}

	const host = hostGlobal<Record<string, any>>('__octaneGtkHost')
	if (!host?.createOverlayLayer || !host.mountServiceRoot) {
		console.warn('[Toast] linux-gtk overlay host is not mounted; toast was skipped')
		return
	}

	const layers: Partial<Record<ToastPosition, any>> = {}
	for (const position of TOAST_POSITIONS) {
		const layer = host.createOverlayLayer({
			modal: false,
			scrim: false,
			align: TOAST_EDGE_ALIGN[position],
		})
		layer.setVisible(true)
		layers[position] = layer
	}

	const unregister = registerToastViewport(FALLBACK_TOAST_VIEWPORT)
	const mounted = host.mountServiceRoot(layers.bottomEnd, GtkToastSurface, {
		viewportId: FALLBACK_TOAST_VIEWPORT,
		position: 'bottomEnd',
		layers,
	})
	fallback = { layers, unmount: mounted.unmount }

	// The layers dispose on root teardown (or explicit disposal) — clear the
	// fallback so the next toast re-presents it. mountServiceRoot already
	// chained the service root's unmount into the host layer's dispose.
	const hostLayer = layers.bottomEnd
	const release = hostLayer.dispose.bind(hostLayer)
	hostLayer.dispose = () => {
		for (const layer of Object.values(layers)) {
			if (layer !== hostLayer) {
				try { (layer as any).dispose() } catch { }
			}
		}
		release()
		unregister()
		if (fallback?.layers === layers) {
			fallback = null
		}
	}
}

/** Module-level toast (Astryx `useToast` fallback path as a function):
 *  lands on the fallback edge stacks over the most recent live root. */
export const showToast: ShowToastFn = (options: ToastOptions) => {
	ensureFallbackViewport()
	return toastHandleFor(pushToast(options, undefined))
}

/** Imperative toast control (Astryx `useToast`), GTK leaf. Inside a
 *  `ToastViewport` toasts dock on that viewport's overlay layers at its
 *  configured edge; outside one they land on the fallback stack. */
export function useToast(): ShowToastFn @{
	const ctx = useContext(ToastViewportContext)
	return useCallback(
		(options: ToastOptions) => {
			// Always keep the fallback stack mounted — it receives orphaned
			// entries when their declaring viewport unmounts (macOS parity).
			ensureFallbackViewport()
			return toastHandleFor(pushToast(options, ctx?.id))
		},
		[ctx?.id],
	)
}
