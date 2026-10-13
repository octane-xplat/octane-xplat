// Share — AppKit host leaf. The macOS host owns the window and presents
// NSSharingServicePicker itself; this leaf only forwards the payload through
// the __xplatAppKit seam.
import type { Share, ShareResult } from './types'

const host = () => (globalThis as any).__xplatAppKit ?? {}

export const share: Share = {
	async text(text: string): Promise<ShareResult> {
		return host().shareContent?.({ text }) ?? 'unavailable'
	},
	async url(url: string, title?: string): Promise<ShareResult> {
		return host().shareContent?.({ url, title }) ?? 'unavailable'
	},
	async file(path: string): Promise<ShareResult> {
		return host().shareContent?.({ file: path }) ?? 'unavailable'
	},
}
