// Share — web leaf. navigator.share where present (mobile Safari/Chrome);
// desktop degrades to clipboard copy so the call still does something useful.
import { desktopHostClient, desktopHostSupports } from '@octane-xplat/platform/host/web'

export const share = {
	async text(text: string, subject?: string): Promise<'shared' | 'copied' | 'unavailable'> {
		const host = desktopHostClient()
		if (host && (await desktopHostSupports('system', 'shareContent'))) {
			return host.call('system', 'shareContent', { text, title: subject })
		}

		const nav = navigator as any
		if (nav.share) {
			await nav.share({ text, title: subject })
			return 'shared'
		}

		if (nav.clipboard) {
			await nav.clipboard.writeText(text)
			return 'copied'
		}

		return 'unavailable'
	},
	async url(url: string, title?: string): Promise<'shared' | 'copied' | 'unavailable'> {
		const host = desktopHostClient()
		if (host && (await desktopHostSupports('system', 'shareContent'))) {
			return host.call('system', 'shareContent', { url, title })
		}

		const nav = navigator as any
		if (nav.share) {
			await nav.share({ url, title })
			return 'shared'
		}

		if (nav.clipboard) {
			await nav.clipboard.writeText(url)
			return 'copied'
		}

		return 'unavailable'
	},
}
