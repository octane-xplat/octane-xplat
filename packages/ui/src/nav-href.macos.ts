import { openUrl } from '@octane-xplat/platform'
import { router } from './default-router.macos'
import { sanitizeUrl } from './safe-url'

/** App-relative paths use canonical routing; external URLs use the OS opener. */
export function followHref(href: string): void {
	const url = sanitizeUrl(href)
	if (!url) return
	if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
		openUrl(url)
		return
	}
	void router.navigateUrl(url)
}
