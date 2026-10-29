import { router, defaultRouterRuntime } from '../../routing/default-router.web'

/** Route app-relative URLs through the canonical client; preserve external URLs. */
export function followHref(href: string): void {
	if (!href) {
		return
	}
	if (
		defaultRouterRuntime.configured.getSnapshot() &&
		router.resolveUrl(href).status === 'matched'
	) {
		void router.navigateUrl(href)
		return
	}
	window.location.href = href
}
