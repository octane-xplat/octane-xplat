import '@nativescript/macos-node-api'
import { createMacOSWebView } from '@octane-xplat/desktop-webview/macos'
import { createAppKitWindow } from './src/appkit'
import { createDesktopWebViewHost, type AppKitHostServices } from './src/desktop-webview-host'

import type {
	CameraProofEvents,
	CameraProofResult,
	CameraProofServices,
} from './src/webview-camera-proof-contracts'

const hostServices = (globalThis as typeof globalThis & { __xplatAppKit: AppKitHostServices })
	.__xplatAppKit

const appKit = createAppKitWindow({ terminateAfterLastWindowClosed: true })
appKit.window.title = 'Octane camera WKWebView proof'

const webView = createMacOSWebView(appKit.contentView)
const address = (
	globalThis as typeof globalThis & { process: { env: Record<string, string | undefined> } }
).process.env.OCTANE_MACOS_WEBVIEW_URL

const desktopHost = createDesktopWebViewHost<CameraProofServices, CameraProofEvents>(
	webView,
	hostServices,
	address ?? null,
	(_sender, _emit) => ({
		application: {
			report(result: CameraProofResult) {
				console.log(
					`${result.ok ? 'XPLAT_CAMERA_WEBVIEW_PROOF_OK' : 'XPLAT_CAMERA_WEBVIEW_PROOF_FAILED'} ${JSON.stringify(result)}`,
				)

				return true
			},
		},
	}),
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

console.log(`[camera-webview-proof] loaded ${address ?? 'Contents/Resources/web/index.html'}`)
