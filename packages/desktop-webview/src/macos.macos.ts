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
	movieDirectory(): string | null
	reserveMoviePath(options: { fileUrl?: string; container?: string }): { fileUrl: string } | null
	writeMovieFile(options: { fileUrl: string; base64: string }): { name: string; uri: string } | null
	movieFileInfo(uri: string): { exists: boolean; fileUrl?: string; size?: number } | null
	readMovieFile(uri: string): string | null
	deleteMovieFile(uri: string): boolean
	mediaPermissionStatus(kind: string): string
	requestMediaPermission(kind: string): string
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
	/** The app-private recordings directory URL (file://…), created on demand. */
	movieDirectory(): string | null
	/** Validate a movie destination before capture; returns the file URL to use. */
	reserveMoviePath(options: { fileUrl?: string; container?: string }): { fileUrl: string } | null
	/** Commit recorded movie bytes atomically; never overwrites. */
	writeMovieFile(options: { fileUrl: string; base64: string }): { name: string; uri: string } | null
	movieFileInfo(uri: string): { exists: boolean; fileUrl?: string; size?: number } | null
	/** Read a stored movie back as base64. */
	readMovieFile(uri: string): string | null
	deleteMovieFile(uri: string): boolean
	/** macOS privacy status for 'camera' or 'microphone'; 'undeclared' when the
	 *  app's Info.plist lacks the usage description. */
	mediaPermissionStatus(kind: 'camera' | 'microphone'): string
	requestMediaPermission(kind: 'camera' | 'microphone'): string
	dispose(): void
}

/** NSDictionary values bridge as opaque objects — keys resolve through
 *  objectForKey rather than JS property access. */
const dictValue = (dictionary: any, key: string): unknown =>
	dictionary?.objectForKey?.(key) ?? dictionary?.[key]

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
			const file = disposed ? null : native.pickFile({ accept, startingFolder })
			return file
				? {
						name: String(dictValue(file, 'name')),
						uri: String(dictValue(file, 'uri')),
					}
				: null
		},
		readFileText(uri) {
			return disposed ? null : native.readFileText(uri)
		},
		writeFileText(name, text) {
			const file = disposed ? null : native.writeFileText({ name, text })
			return file
				? {
						name: String(dictValue(file, 'name')),
						uri: String(dictValue(file, 'uri')),
					}
				: null
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
		movieDirectory() {
			const directory = disposed ? null : native.movieDirectory()
			return directory ? String(directory) : null
		},
		reserveMoviePath(options) {
			const reservation = disposed ? null : native.reserveMoviePath(options)
			return reservation ? { fileUrl: String(dictValue(reservation, 'fileUrl')) } : null
		},
		writeMovieFile(options) {
			const file = disposed ? null : native.writeMovieFile(options)
			return file
				? {
						name: String(dictValue(file, 'name')),
						uri: String(dictValue(file, 'uri')),
					}
				: null
		},
		movieFileInfo(uri) {
			const info = disposed ? null : native.movieFileInfo(uri)
			if (!info) {
				return null
			}

			return {
				exists: Boolean(dictValue(info, 'exists')),
				...(dictValue(info, 'fileUrl') !== undefined
					? { fileUrl: String(dictValue(info, 'fileUrl')) }
					: {}),
				...(dictValue(info, 'size') !== undefined ? { size: Number(dictValue(info, 'size')) } : {}),
			}
		},
		readMovieFile(uri) {
			const data = disposed ? null : native.readMovieFile(uri)
			return data ? String(data) : null
		},
		deleteMovieFile(uri) {
			return !disposed && native.deleteMovieFile(uri)
		},
		mediaPermissionStatus(kind) {
			return disposed ? 'unavailable' : String(native.mediaPermissionStatus(kind))
		},
		requestMediaPermission(kind) {
			return disposed ? 'unavailable' : String(native.requestMediaPermission(kind))
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
