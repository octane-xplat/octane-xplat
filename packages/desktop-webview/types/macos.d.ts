export interface MacOSWebView {
	/** Load a development page from localhost over HTTP. */
	load(address: string): boolean
	/** Load Contents/Resources/web/index.html from the app bundle. */
	loadPackaged(): boolean
	/** Install a JSON-encoded initial state before the next document load. */
	setBootstrap(serialized: string): boolean
	installDispatcher(dispatch: (message: string) => void): void
	deliver(message: string): void
	dispose(): void
}

/** Attach the system WKWebView to an app-owned AppKit content view. */
export declare function createMacOSWebView(parent: object): MacOSWebView
