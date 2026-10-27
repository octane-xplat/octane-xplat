// Web browser — macOS leaf. macOS has no in-app browser controller
// (SFSafariViewController is iOS-only), so openBrowser delegates to the
// external browser through the platform host. `supported` stays false — the
// delegate path is convenience, not the in-app contract.
import { openUrl } from '@octane-xplat/platform'
import type { OpenBrowserOptions, WebBrowser, WebBrowserResult } from './types'

export const webBrowser: WebBrowser = {
	supported: false,

	openBrowser(url: string, _options?: OpenBrowserOptions): Promise<WebBrowserResult> {
		return Promise.resolve({ type: openUrl(url) ? 'opened' : 'cancel' })
	},

	dismissBrowser(): void {},
	warmUp: () => Promise.resolve(),
	coolDown: () => Promise.resolve(),
	mayInitWithUrl: () => Promise.resolve(),
}
