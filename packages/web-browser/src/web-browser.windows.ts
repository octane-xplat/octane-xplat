// Windows leaf — no SFSafariViewController/Custom Tabs equivalent; the
// fallback is platform's openUrl (external browser). supported stays false.
import { Utils } from '@nativescript/core'
import type { OpenBrowserOptions, WebBrowser, WebBrowserResult } from './types'

export const webBrowser: WebBrowser = {
	supported: false,

	openBrowser(url: string, _options?: OpenBrowserOptions): Promise<WebBrowserResult> {
		return Promise.resolve({ type: Utils.openUrl(url) ? 'opened' : 'cancel' })
	},

	dismissBrowser(): void {},
	warmUp: () => Promise.resolve(),
	coolDown: () => Promise.resolve(),
	mayInitWithUrl: () => Promise.resolve(),
}
