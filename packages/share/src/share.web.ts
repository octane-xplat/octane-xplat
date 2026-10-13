// Share — web leaf. navigator.share where present (mobile Safari/Chrome);
// desktop degrades to clipboard copy so the call still does something useful.
// Files can't share by path in a browser — the Web Share API needs a File
// handle — so share.file only reaches a sheet through the desktop host seam.
import { desktopHost, desktopHostSupports } from '@octane-xplat/platform/host/web'
import type { Share, ShareResult } from './types'

async function navShare(payload: { text?: string; url?: string; title?: string }): Promise<ShareResult> {
	const nav = navigator as any
	if (nav.share) {
		try {
			await nav.share(payload)
			return 'shared'
		} catch (error) {
			if ((error as Error)?.name === 'AbortError') {
				return 'cancelled'
			}

			throw error
		}
	}

	if (nav.clipboard) {
		await nav.clipboard.writeText(payload.url ?? payload.text ?? '')
		return 'copied'
	}

	return 'unavailable'
}

export const share: Share = {
	async text(text: string, subject?: string): Promise<ShareResult> {
		const host = desktopHost()
		if (host && (await desktopHostSupports('system', 'shareContent'))) {
			return host.system.shareContent({ text, title: subject })
		}

		return navShare({ text, title: subject })
	},
	async url(url: string, title?: string): Promise<ShareResult> {
		const host = desktopHost()
		if (host && (await desktopHostSupports('system', 'shareContent'))) {
			return host.system.shareContent({ url, title })
		}

		return navShare({ url, title })
	},
	async file(path: string): Promise<ShareResult> {
		const host = desktopHost()
		if (host && (await desktopHostSupports('system', 'shareContent'))) {
			return host.system.shareContent({ file: path })
		}

		return 'unavailable'
	},
}
