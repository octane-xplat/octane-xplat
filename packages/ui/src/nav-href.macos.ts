import { hostGlobal } from './host-bridge'
import { router } from './default-router.macos'

/** App-relative paths use canonical routing; external URLs use the host opener. */
export function followHref(href: string): void {
	if (!href) {
		return
	}

	if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
		const open = hostGlobal('__xplatAppKitOpenWindow')
		if (typeof open === 'function') {
			open({ url: href })
		}

		return
	}

	void router.navigateUrl(href)
}
