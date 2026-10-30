import { createAppKitWebBrowser, type AppKitBrowserFactory } from './browser-owner.macos.ts'
import type { WebBrowser } from './types.ts'

declare const XplatInAppBrowser: AppKitBrowserFactory

/** Package-owned WebKit window; unavailable bridges never launch another app. */
export const webBrowser: WebBrowser = createAppKitWebBrowser(() =>
	typeof XplatInAppBrowser === 'undefined' ? undefined : XplatInAppBrowser,
)
