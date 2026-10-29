import { Utils } from '@nativescript/core'
import { router } from '../../routing/default-router'

/** Explicit external URLs open through the OS; app paths use canonical routing. */
export function followHref(href: string): void {
	if (!href) {
		return
	}
	if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
		Utils.openUrl(href)
		return
	}
	void router.navigateUrl(href).then((result) => {
		if (result.status === 'not-found' || result.status === 'invalid-input') {
			console.warn('[octane-xplat] No route for the supplied href')
		}
	})
}
