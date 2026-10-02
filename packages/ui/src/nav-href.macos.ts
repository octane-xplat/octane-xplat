import { pushDeepLink } from './route.macos'

/** AppKit leaf — app-relative hrefs go to the route table (its
 *  `pushDeepLink` reports no match state, so the split is by shape):
 *  scheme-qualified URLs ask the host bridge to open a browser window. */
export function followHref(href: string): void {
	if (!href) {
		return
	}
	if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
		const open = (globalThis as any).__xplatAppKitOpenWindow
		if (typeof open === 'function') {
			open({ url: href })
		}

		return
	}

	pushDeepLink(href)
}
