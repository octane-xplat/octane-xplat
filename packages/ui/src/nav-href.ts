import { Utils } from '@nativescript/core'
import { pushDeepLink } from './route'

/** Activate an `href` outside a real anchor: the route table wins (an app
 *  deep link), then the platform URL opener for absolute URLs. Relative
 *  hrefs that match no route warn once — there is no address bar to hand
 *  them to on native. */
const warned = new Set<string>()

export function followHref(href: string): void {
	if (!href) {
		return
	}
	if (pushDeepLink(href)) {
		return
	}
	if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
		Utils.openUrl(href)
		return
	}

	if (!warned.has(href)) {
		warned.add(href)
		console.warn(
			`[octane-xplat] href '${href}' matched no route — relative links need a registered deep link (see docs/app/navigation.md).`,
		)
	}
}
