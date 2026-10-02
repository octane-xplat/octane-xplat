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
	dispose(): void
}

/** Attach the system WKWebView to an app-owned AppKit content view. */
export declare function createMacOSWebView(parent: object): MacOSWebView
