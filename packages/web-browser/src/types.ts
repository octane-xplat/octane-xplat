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
	/** Synchronous fast check — an in-app browser controller exists.
	 *  AppKit checks the package-owned native bridge; availability is not
	 *  a successful presentation, network load or runtime qualification. */
	readonly supported: boolean
	/** Open `url` in the platform in-app browser. Resolves 'opened' once the
	 *  browser presents. AppKit accepts HTTP(S) only and cancels when its
	 *  bridge cannot present; it never falls back to another application. */
	openBrowser(url: string, options?: OpenBrowserOptions): Promise<WebBrowserResult>
	/** Close the owned browser on iOS, web and AppKit. Android is a no-op. */
	dismissBrowser(): void
	/** Android only: pre-warm the Custom Tabs service connection. */
	warmUp(packageName?: string): Promise<void>
	/** Android only: release the service connection. */
	coolDown(packageName?: string): Promise<void>
	/** Android only: hint likely URLs for pre-render. */
	mayInitWithUrl(url: string, packageName?: string): Promise<void>
}

export declare const webBrowser: WebBrowser
