import { createAppKitWebBrowser } from './browser-owner.macos.ts'
import { createInAppBrowserFactory } from './in-app-browser.macos.ts'
import type { WebBrowser } from './types.ts'

/** Package-owned WebKit window; unavailable bridges never launch another app. */
export const webBrowser: WebBrowser = createAppKitWebBrowser(createInAppBrowserFactory)
