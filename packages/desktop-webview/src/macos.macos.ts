import '@nativescript/macos-node-api'

interface NativeWebView {
	attachTo(parent: object): void
	load(address: string): boolean
	loadPackaged(address: string): boolean
	setBootstrap(serialized: string): boolean
	installDispatcher(dispatch: (message: string) => void): void
	deliver(message: string): void
	dispose(): void
}

declare const XplatWebViewHost: {
	alloc(): { init(): NativeWebView }
}

export interface MacOSWebView {
	load(address: string): boolean
	loadPackaged(address: string): boolean
	setBootstrap(serialized: string): boolean
	installDispatcher(dispatch: (message: string) => void): void
	deliver(message: string): void
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
		loadPackaged() {
			return !disposed && native.loadPackaged()
		},
		setBootstrap(serialized) {
			return !disposed && native.setBootstrap(serialized)
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
		dispose() {
			if (disposed) {
				return
			}
			disposed = true
			native.dispose()
		},
	}
}
