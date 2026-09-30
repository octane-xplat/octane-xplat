// Share — AppKit host leaf. The macOS host owns the window and presents
// NSSharingServicePicker itself; this leaf only forwards the payload through
// the __xplatAppKit seam.
import type { ShareResult } from './types'

const host = () => (globalThis as any).__xplatAppKit ?? {}

export const share = {
	async text(text: string): Promise<ShareResult> {
		return host().shareContent?.({ text }) ?? 'unavailable'
	},
	async url(url: string, title?: string): Promise<ShareResult> {
		return host().shareContent?.({ url, title }) ?? 'unavailable'
	},
}
