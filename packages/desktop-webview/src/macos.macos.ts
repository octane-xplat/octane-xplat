import '@nativescript/macos-node-api'

interface NativeWebView {
	attachTo(parent: object): void
	load(address: string): boolean
	loadPackaged(path: string): boolean
	setBootstrap(serialized: string): boolean
	setWindowContext(context: { id: string; data: string }): boolean
	owningWindow(): object | null
	installDispatcher(dispatch: (message: string) => void): void
	deliver(message: string): void
	pickFile(options: {
		accept: string
		startingFolder: string | null
	}): { name: string; uri: string } | null
	readFileText(uri: string): string | null
	writeFileText(options: { name: string; text: string }): { name: string; uri: string } | null
	notificationPermission(): 'granted' | 'denied' | 'unsupported'
	requestNotificationPermission(): boolean
	notify(options: { title: string; body: string }): boolean
	secureStorageGet(key: string): string | null
	secureStorageSet(options: { key: string; value: string }): boolean
	secureStorageRemove(key: string): boolean
	dispose(): void
}

declare const XplatWebViewHost: {
	alloc(): { init(): NativeWebView }
}

export interface MacOSWebView {
	load(address: string): boolean
	loadPackaged(path: string): boolean
	setBootstrap(serialized: string): boolean
	setWindowContext(id: string, data: string): boolean
	owningWindow(): object | null
	installDispatcher(dispatch: (message: string) => void): void
	deliver(message: string): void
	pickFile(accept: string, startingFolder: string | null): { name: string; uri: string } | null
	readFileText(uri: string): string | null
	writeFileText(name: string, text: string): { name: string; uri: string } | null
	notificationPermission(): 'granted' | 'denied' | 'unsupported'
	requestNotificationPermission(): boolean
	notify(title: string, body: string): boolean
	secureStorageGet(key: string): string | null
	secureStorageSet(key: string, value: string): boolean
	secureStorageRemove(key: string): boolean
	dispose(): void
}

/** Attach the system WKWebView to an app-owned AppKit content view. */
export function createMacOSWebView(parent: object): MacOSWebView {
	const native = XplatWebViewHost.alloc().init()
	native.attachTo(parent)
	let disposed = false

	return {
		load(address) {
			return !disposed && native.load(address)
		},
		loadPackaged(path) {
			return !disposed && native.loadPackaged(path || 'index.html')
		},
		setBootstrap(serialized) {
			return !disposed && native.setBootstrap(serialized)
		},
		setWindowContext(id, data) {
			return !disposed && native.setWindowContext({ id, data })
		},
		owningWindow() {
			return disposed ? null : native.owningWindow()
		},
		installDispatcher(dispatch) {
			if (disposed) {
				throw new Error('macOS webview is disposed')
			}

			native.installDispatcher(dispatch)
		},
		deliver(message) {
			if (!disposed) {
				native.deliver(message)
			}
		},
		pickFile(accept, startingFolder) {
			return disposed ? null : native.pickFile({ accept, startingFolder })
		},
		readFileText(uri) {
			return disposed ? null : native.readFileText(uri)
		},
		writeFileText(name, text) {
			return disposed ? null : native.writeFileText({ name, text })
		},
		notificationPermission() {
			return disposed ? 'unsupported' : native.notificationPermission()
		},
		requestNotificationPermission() {
			return !disposed && native.requestNotificationPermission()
		},
		notify(title, body) {
			return !disposed && native.notify({ title, body })
		},
		secureStorageGet(key) {
			return disposed ? null : native.secureStorageGet(key)
		},
		secureStorageSet(key, value) {
			return !disposed && native.secureStorageSet({ key, value })
		},
		secureStorageRemove(key) {
			return !disposed && native.secureStorageRemove(key)
		},
		dispose() {
			if (disposed) {
				return
			}

			disposed = true
			native.dispose()
		},
	}
}
