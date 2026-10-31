import { hostGlobal } from '../../internal/platform/host-bridge'
import { router } from '../../routing/default-router'

/** Explicit external URLs open through the host's URI seam (Gtk.show_uri_full
 * on the app's main window); app paths use canonical routing. A bridge
 * without the seam surfaces the request as a warning rather than dropping
 * it — the macOS leaf does the same when no host opener is installed. */
export function followHref(href: string): void {
	if (!href) {
		return
	}
	if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
		const open = hostGlobal('__octaneGtkHost')?.openUri
		if (typeof open !== 'function' || open(href) !== true) {
			console.warn(`[octane-xplat] Cannot open external URI on this GTK host: ${href}`)
		}
		return
	}
	void router.navigateUrl(href).then((result) => {
		if (result.status === 'not-found' || result.status === 'invalid-input') {
			console.warn('[octane-xplat] No route for the supplied href')
		}
	})
}
