// Internal-URL navigation seam — route app-relative URLs through the
// configured canonical router; let unknown paths fall back to document
// navigation. Mirrors packages/ui nav-href.web.ts at app level.

import { router } from '@octane-xplat/ui/routing'

export function followHref(href: string): void {
	if (!href) {return}
	if (router.resolveUrl(href).status === 'matched') {
		void router.navigateUrl(href)
		return
	}
	window.location.href = href
}
