/** Result of openBrowser — 'opened' once the browser is presented (the call
 *  resolves on open, not on dismiss, matching expo-web-browser), 'cancel'
 *  when nothing could present, 'dismiss' where the platform reports the
 *  user's close instead of an open (Android Custom Tab finish callbacks). */
export type WebBrowserResult = { type: 'opened' | 'cancel' | 'dismiss' }

export type WebBrowserPresentationStyle =
	| 'automatic'
	| 'fullScreen'
	| 'pageSheet'
	| 'formSheet'
	| 'popover'

export interface OpenBrowserOptions {
	/** Android Custom Tab toolbar color (CSS hex). iOS maps this to
	 *  `preferredBarTintColor`. */
	toolbarColor?: string
	/** iOS `preferredControlTintColor`. */
	controlsColor?: string
	/** Android: show the page title in the Custom Tab toolbar. */
	showTitle?: boolean
	/** Android: toolbar hides as the page scrolls. */
	enableBarCollapsing?: boolean
	/** iOS `UIModalPresentationStyle` for the Safari controller. */
	presentationStyle?: WebBrowserPresentationStyle
}

export interface WebBrowser {
	/** Synchronous fast check — an in-app browser controller exists
	 *  (iOS/Android/web). macOS reports false: it delegates to the external
	 *  browser, which is not the in-app contract. */
	readonly supported: boolean
	/** Open `url` in the platform in-app browser. Resolves 'opened' once the
	 *  browser presents; on macOS delegates to the external browser. */
	openBrowser(url: string, options?: OpenBrowserOptions): Promise<WebBrowserResult>
	/** iOS only: programmatically close a presented browser. No-op elsewhere. */
	dismissBrowser(): void
	/** Android only: pre-warm the Custom Tabs service connection. */
	warmUp(packageName?: string): Promise<void>
	/** Android only: release the service connection. */
	coolDown(packageName?: string): Promise<void>
	/** Android only: hint likely URLs for pre-render. */
	mayInitWithUrl(url: string, packageName?: string): Promise<void>
}

export declare const webBrowser: WebBrowser
