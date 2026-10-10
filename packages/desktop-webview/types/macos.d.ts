export interface MacOSWebView {
	/** Load a development page from localhost over HTTP. */
	load(address: string): boolean
	/** Load a page inside Contents/Resources/web. */
	loadPackaged(path: string): boolean
	/** Install a JSON-encoded initial state before the next document load. */
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
	reserveMoviePath(options: {
		fileUrl?: string
		container?: string
	}): { fileUrl: string } | null
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

/** Attach the system WKWebView to an app-owned AppKit content view. */
export declare function createMacOSWebView(parent: object): MacOSWebView
