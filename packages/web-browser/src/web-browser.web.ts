// Web browser — web leaf. window.open in a new tab is the closest thing to
// an in-app browser the web has; close detection is best-effort (the window
// handle's `closed` flag, checked on focus — we can't observe it without a
// polling loop, so 'dismiss' is not reported).
import type { OpenBrowserOptions, WebBrowser, WebBrowserResult } from './types'

let opened: Window | null = null

export const webBrowser: WebBrowser = {
	supported: typeof window !== 'undefined' && typeof window.open === 'function',

	openBrowser(url: string, _options?: OpenBrowserOptions): Promise<WebBrowserResult> {
		opened = window.open(url, '_blank', 'noopener')
		return Promise.resolve({ type: opened ? 'opened' : 'cancel' })
	},

	dismissBrowser(): void {
		opened?.close()
		opened = null
	},

	warmUp: () => Promise.resolve(),
	coolDown: () => Promise.resolve(),
	mayInitWithUrl: () => Promise.resolve(),
}
