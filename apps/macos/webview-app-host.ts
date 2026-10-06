import '@nativescript/macos-node-api'
import { createMacOSWebView } from '@octane-xplat/desktop-webview/macos'
import type {
	FrameworkHostEvents,
	FrameworkHostServices,
} from '@octane-xplat/platform/host/services'

import { createAppKitWindow } from './src/appkit'
import { createDesktopWebViewHost, type AppKitHostServices } from './src/desktop-webview-host'

const hostServices = (globalThis as typeof globalThis & { __xplatAppKit: AppKitHostServices })
	.__xplatAppKit

const appKit = createAppKitWindow({ terminateAfterLastWindowClosed: true })
appKit.window.title = 'Octane macOS'

const webView = createMacOSWebView(appKit.contentView)
const address = (
	globalThis as typeof globalThis & { process: { env: Record<string, string | undefined> } }
).process.env.OCTANE_MACOS_WEBVIEW_URL

const desktopHost = createDesktopWebViewHost<FrameworkHostServices, FrameworkHostEvents>(
	webView,
	hostServices,
	address ?? null,
	() => ({}),
	appKit.window,
)

const loaded = address ? webView.load(address) : webView.loadPackaged('index.html')
if (!loaded) {
	throw new Error('macOS webview could not load its development or packaged app page')
}

void appKit.windowClosed.then(() => {
	desktopHost.dispose()
	appKit.window.delegate = null
	appKit.app.delegate = null
	appKit.delegate = null
})

const externalRunLoop =
	(globalThis as typeof globalThis & { process: { env: Record<string, string | undefined> } })
		.process.env.OCTANE_MACOS_EXTERNAL_RUNLOOP === '1'

if (externalRunLoop) {
	appKit.app.finishLaunching()
	appKit.app.activateIgnoringOtherApps(true)
} else {
	appKit.app.run()
}

console.log(`[macos-webview] loaded ${address ?? 'Contents/Resources/web/index.html'}`)
