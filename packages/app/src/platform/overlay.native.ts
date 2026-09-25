import { GridLayout, getRootLayout } from '@nativescript/core'
import { createNativeScriptRoot } from '@nativescript-community/octane'
import type { UniversalComponent } from 'octane/universal'
import { OverlayPanel } from '../OverlayPanel.tsrx'

let host: GridLayout | null = null

/**
 * Overlays layer over the app's RootLayout (decision #22): one GridLayout
 * host (multi-child — ContentView would drop all but the last root view),
 * one Octane sub-root, RootLayout.open/close for z-order + shadeCover.
 */
export function openOverlay() {
	const rl = getRootLayout()
	if (!rl) {
		console.log('[probe] overlay: no rootlayout found')
		return
	}

	if (!host) {
		host = new GridLayout()
		host.id = 'overlay-host'
		createNativeScriptRoot(host).render(OverlayPanel as unknown as UniversalComponent, {})
	}

	// Same unhandled-rejection hazard as openSheet: rl.open rejects when
	// the host is still attached — close first, always handle the promise.
	if ((rl as any).hasChild?.(host)) (rl as any).close(host)

	;(
		rl.open(host, {
			shadeCover: { opacity: 0.4, tapToClose: true },
		}) as Promise<unknown>
	).then(
		() => console.log('[probe] overlay open'),
		(e: Error) => console.log('[probe] overlay open FAILED: ' + e.message),
	)
}

export function closeOverlay() {
	const rl = getRootLayout()
	if (rl && host) rl.close(host)
	console.log('[probe] overlay close')
}
