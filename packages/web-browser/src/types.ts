/** Result of openBrowser — 'opened' once the browser is presented (the call
 *  resolves on open, not on dismiss, matching expo-web-browser), 'cancel'
 *  when nothing could present, 'dismiss' where the platform reports the
 *  user's close instead of an open (Android Custom Tab finish callbacks). */
export type WebBrowserResult = {
	/** 'opened' once the browser presents (not on dismiss), 'cancel' when
	 *  nothing could present, 'dismiss' where the platform reports the
	 *  user's close instead (Android Custom Tab finish callbacks). */
	type: 'opened' | 'cancel' | 'dismiss'
}

/** iOS `UIModalPresentationStyle` equivalents for the Safari controller;
 *  ignored on other platforms. */
export type WebBrowserPresentationStyle =
	| 'automatic'
	| 'fullScreen'
	| 'pageSheet'
	| 'formSheet'
	| 'popover'

/** Presentation options for openBrowser; every member is a per-platform
 *  hint (see each field) and all are optional. */
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

/** In-app browser façade: iOS SFSafariViewController, Android Custom Tabs,
 *  AppKit package-owned bridge. */
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
