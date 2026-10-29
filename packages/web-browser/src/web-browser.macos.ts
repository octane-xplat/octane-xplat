import { createAppKitWebBrowser, type AppKitBrowserFactory } from './browser-owner.macos.ts'

declare const XplatInAppBrowser: AppKitBrowserFactory

/** Package-owned WebKit window; unavailable bridges never launch another app. */
export const webBrowser = createAppKitWebBrowser(() => typeof XplatInAppBrowser === 'undefined' ? undefined : XplatInAppBrowser)
