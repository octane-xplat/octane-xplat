import '@nativescript/macos-node-api'
import { createMacOSWebView } from '@octane-xplat/desktop-webview/macos'
import { createHostDispatcher } from '@octane-xplat/platform/host'
import type {
	FrameworkHostEvents,
	FrameworkHostServices,
} from '@octane-xplat/platform/host/services'

import type { AppInfo, AppState, WindowSize } from '@octane-xplat/platform'
import { createAppKitWindow } from './src/appkit.mjs'
import type { HostColorScheme, HostShareResult } from '@octane-xplat/platform/host/services'

interface AppKitHostServices {
	appInfo: AppInfo
	appState: AppState
	windowSize: WindowSize
	readClipboard(): string | null
	writeClipboard(value: string): boolean
	storageGet(key: string): string | null
	storageSet(key: string, value: string): void
	storageRemove(key: string): void
	openUrl(url: string): boolean
	shareContent(input: { text?: string; url?: string; title?: string }): HostShareResult
	consumeInitialUrl(): string | null
	getColorScheme(): HostColorScheme
	onAppStateChange(listener: () => void): () => void
	onWindowResize(listener: () => void): () => void
	onDeepLink(listener: (url: string) => void): () => void
	onAppearanceChange(listener: () => void): () => void
}

const hostServices = (globalThis as typeof globalThis & { __xplatAppKit: AppKitHostServices })
	.__xplatAppKit

const appKit = createAppKitWindow({ terminateAfterLastWindowClosed: true })
appKit.window.title = 'Octane macOS'

const webView = createMacOSWebView(appKit.contentView)
const dispatcher = createHostDispatcher<FrameworkHostServices, FrameworkHostEvents>(
	{
		app: {
			getInfo: () => hostServices.appInfo,
			getState: () => hostServices.appState,
			getWindowSize: () => hostServices.windowSize,
			consumeInitialUrl: () => hostServices.consumeInitialUrl(),
			getColorScheme: () => hostServices.getColorScheme(),
		},
		clipboard: {
			async read() {
				return hostServices.readClipboard()
			},
			async write(value) {
				return hostServices.writeClipboard(value)
			},
		},
		storage: {
			async get(key) {
				return hostServices.storageGet(key)
			},
			async set(key, value) {
				hostServices.storageSet(key, value)
			},
			async remove(key) {
				hostServices.storageRemove(key)
			},
		},
		system: {
			async openUrl(url) {
				return hostServices.openUrl(url)
			},
			async shareContent(input) {
				return hostServices.shareContent(input)
			},
		},
	},
	{
		reply(message) {
			webView.deliver(message)
		},
		emit(message) {
			webView.deliver(message)
		},
	},
)

const snapshot = {
	appInfo: hostServices.appInfo,
	appState: hostServices.appState,
	windowSize: hostServices.windowSize,
	initialUrl: hostServices.consumeInitialUrl(),
	colorScheme: hostServices.getColorScheme(),
}

if (!webView.setBootstrap(JSON.stringify(snapshot))) {
	throw new Error('macOS host could not serialize the initial webview state')
}

webView.installDispatcher((message) => {
	void dispatcher.dispatch(message)
})

const removeServiceListeners = [
	hostServices.onAppStateChange(() => dispatcher.emit('app.state.change', hostServices.appState)),
	hostServices.onWindowResize(() => dispatcher.emit('window.resize', hostServices.windowSize)),
	hostServices.onDeepLink((url) => dispatcher.emit('app.deep-link', url)),
	hostServices.onAppearanceChange(() =>
		dispatcher.emit('appearance.change', hostServices.getColorScheme()),
	),
]

const address = (
	globalThis as typeof globalThis & { process: { env: Record<string, string | undefined> } }
).process.env.OCTANE_MACOS_WEBVIEW_URL

const loaded = address ? webView.load(address) : webView.loadPackaged()
if (!loaded) {
	throw new Error('macOS webview could not load its development or packaged app page')
}

void appKit.windowClosed.then(() => {
	for (const remove of removeServiceListeners) {
		remove()
	}

	webView.dispose()
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
