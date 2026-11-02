// AppKit/WebKit in-app browser, ported from the removed Swift XplatInAppBrowser.
// Identical contract: HTTP(S)-only navigation policy, one owned window with
// toolbar/history chrome, website-labeled dialog and file sheets, one-shot
// completion claiming, KVO-driven chrome, and full teardown on close,
// replacement or user window close. WebKit loads inside WebKit's own
// processes, so the JS-involved NSURLSession starvation recorded in
// .agents/docs/notes/macos-jsc-host.md does not apply; delegate dispatch and
// sheet completion blocks are runtime-verified in tests/verify-macos.mjs.
import {
	_Block_copy,
	_Block_release,
	interop,
	NSAlert,
	NSAlertFirstButtonReturn,
	NSApplication,
	NSBackingStoreType,
	NSButton,
	NSLayoutAttribute,
	NSLayoutConstraint,
	NSLayoutConstraintOrientation,
	NSLayoutPriorityDefaultLow,
	NSLineBreakMode,
	NSModalResponseCancel,
	NSModalResponseOK,
	NSObject,
	NSOpenPanel,
	NSOperationQueue,
	NSStackView,
	NSTextField,
	NSThread,
	NSInvocation,
	NSMethodSignature,
	NSURL,
	NSURLRequest,
	NSURLErrorCancelled,
	NSURLErrorDomain,
	NSUserInterfaceLayoutOrientation,
	NSView,
	NSWindow,
	NSWindowDelegate,
	NSWindowStyleMask,
	WKFrameInfo,
	WKNavigationAction,
	WKNavigationActionPolicy,
	WKNavigationDelegate,
	WKOpenPanelParameters,
	WKUIDelegate,
	WKWebView,
	WKWebViewConfiguration,
	WKWindowFeatures,
} from '@octane-xplat/platform/macos'
import type { AppKitBrowserFactory, AppKitBrowserNative } from './browser-owner.macos.ts'

const sameObject = (a: unknown, b: unknown): boolean =>
	a === b || (a != null && (a as NSObject).isEqual?.(b) === true)

const setAccessibilityLabel = (view: NSObject, label: string): void => {
	const setter = 'setAccessibilityLabel' in view ? view.setAccessibilityLabel : undefined
	if (typeof setter === 'function') {
		setter.call(view, label)
	}
}

// WebKit's completion-handler blocks arrive as one-shot FunctionPointer
// wrappers whose JS-side invoke path is only valid inside the delegate call.
// Capture the raw block pointer and invoke it later through NSInvocation —
// -[NSBlock invoke] is not bridged as a JS member, so a method-shaped
// signature (v@:<args>, selector 'invoke', args at index >=2) is used to call
// the block's own parameters through the invocation.
const blockArg = (type: number, value: unknown): interop.Reference => {
	const ref = new interop.Reference(type)
	;(ref as { value?: unknown }).value = value
	return ref
}

const callBlock = (block: unknown, argEncoding: string, ...args: interop.Reference[]): void => {
	const signatureObject = NSMethodSignature.signatureWithObjCTypes('v@:' + argEncoding)
	const invocation = NSInvocation.invocationWithMethodSignature(signatureObject)
	invocation.selector = 'invoke'
	for (let i = 0; i < args.length; i++) {
		invocation.setArgumentAtIndex(args[i], i + 2)
	}
	invocation.invokeWithTarget(block)
}

// _Block_copy retains a heap block (and promotes a stack block) so the
// FunctionPointer's invoke path stays valid past the delegate callback.
// The bridged wrapper now owns a copy of the incoming block itself
// (runtimes#111, patched in the shipped framework), so __ns_native_ptr
// resolves to that owned copy and this extra retain is a balanced guard
// rather than load-bearing. Released after the completion is delivered.
// Returns a retainable copy for real WebKit block handlers; JS functions (in
// tests) have no block pointer and stay callable as-is.
const copyBlock = (handler: unknown): interop.Pointer | null => {
	const ptr = blockPointer(handler)
	return ptr === handler ? null : _Block_copy(ptr as interop.PointerConvertible)
}


// Completion is claimed before ending a sheet: AppKit may synchronously
// call back. The async hop lets Cocoa remove the old sheet before the
// page requests another one.
interface PendingSheet {
	readonly window: NSWindow
	claimed: boolean
	readonly deliver: (response: number) => interop.Object
	readonly complete: (value: interop.Object) => void
}

// Captured raw block pointer for a WebKit completion handler — invoked via
// callBlock once the delegate callback has returned.
const blockPointer = (handler: unknown): unknown =>
	(typeof handler === 'object' && handler !== null && '__ns_native_ptr' in handler
		? handler.__ns_native_ptr
		: handler) ?? handler

function finishSheet(sheet: PendingSheet, response: number, parent: NSWindow | null): void {
	if (sheet.claimed) {
		return
	}
	sheet.claimed = true
	const value = sheet.deliver(response)
	const window = sheet.window
	if (parent != null && sameObject(window.sheetParent, parent)) {
		NSApplication.sharedApplication.endSheetReturnCode(window, response)
	}
	window.orderOut(null)
	const complete = sheet.complete
	NSOperationQueue.mainQueue.addOperationWithBlock(() => complete(value))
}

interface Session {
	window: NSWindow | null
	webView: WKWebView | null
	delegate: NSObject | null
	dialog: PendingSheet | null
	fileSelection: PendingSheet | null
	initialURL: NSURL | null
	navigation: unknown
	address: NSTextField | null
	status: NSTextField | null
	backButton: NSButton | null
	forwardButton: NSButton | null
	reloadButton: NSButton | null
}

// Delegate methods may arrive on a different JS wrapper for the same native
// object and interop.handleof tracks the wrapper rather than the ObjC object,
// so session lookup compares receivers with -isEqual: instead.
const sessions = new Set<Session>()
const sessionOf = (target: unknown): Session | undefined => {
	for (const session of sessions) {
		if (
			(session.webView != null && sameObject(session.webView, target)) ||
			(session.delegate != null && sameObject(session.delegate, target)) ||
			(session.window != null && sameObject(session.window, target))
		) {
			return session
		}
	}
	return undefined
}

const isHTTP = (url: NSURL | null | undefined): url is NSURL => {
	if (url == null) {
		return false
	}
	const scheme = String(url.scheme ?? '').toLowerCase()
	return (scheme === 'http' || scheme === 'https') && String(url.host ?? '').length > 0
}

const addressURL = (value: string): NSURL | null => {
	const url = NSURL.URLWithString(value)
	return isHTTP(url) ? url : null
}

function updateChrome(session: Session): void {
	const browser = session.webView
	if (browser == null) {
		return
	}
	const title = browser.title
	if (session.window != null) {
		session.window.title = title != null && String(title).length > 0 ? title : 'Browser'
	}
	if (session.address != null) {
		session.address.stringValue = String(
			browser.URL?.absoluteString ?? session.initialURL?.absoluteString ?? '',
		)
	}
	if (session.backButton != null) {
		session.backButton.enabled = browser.canGoBack
	}
	if (session.forwardButton != null) {
		session.forwardButton.enabled = browser.canGoForward
	}
	if (session.reloadButton != null) {
		session.reloadButton.title = browser.isLoading() ? 'Stop' : 'Reload'
	}
}

function cancelPanels(session: Session): void {
	const pending = session.dialog
	const selection = session.fileSelection
	session.dialog = null
	session.fileSelection = null
	if (pending != null) {
		finishSheet(pending, NSModalResponseCancel, session.window)
	}
	if (selection != null) {
		finishSheet(selection, NSModalResponseCancel, session.window)
	}
}

// KVO registration must outlive browsing; the same key set is registered in
// open and removed in cleanup.
const OBSERVED_KEYS = ['title', 'URL', 'canGoBack', 'canGoForward', 'loading']

function cleanup(
	delegate: NSObject | null,
	panel: NSWindow | null,
	browser: WKWebView | null,
	pending: PendingSheet | null,
	selection: PendingSheet | null,
	close: boolean,
): void {
	const work = () => {
		if (pending != null) {
			finishSheet(pending, NSModalResponseCancel, panel)
		}
		if (selection != null) {
			finishSheet(selection, NSModalResponseCancel, panel)
		}
		if (browser != null) {
			if (delegate != null) {
				for (const key of OBSERVED_KEYS) {
					try {
						browser.removeObserverForKeyPath(delegate, key)
					} catch {
						// An unbalanced removal raises; teardown tolerates it.
					}
				}
			}
			browser.navigationDelegate = null as unknown as WKNavigationDelegate
			browser.UIDelegate = null as unknown as WKUIDelegate
			browser.stopLoading()
		}
		if (panel != null) {
			panel.delegate = null as unknown as NSWindowDelegate
			panel.contentView = null as unknown as NSView
			if (close) {
				panel.close()
			}
		}
	}
	if (NSThread.isMainThread) {
		work()
	} else {
		NSOperationQueue.mainQueue.addOperationWithBlock(work)
	}
}

function teardown(session: Session, close: boolean): void {
	const panel = session.window
	const browser = session.webView
	const pending = session.dialog
	const selection = session.fileSelection
	const delegate = session.delegate
	if (delegate != null) {
		sessions.delete(session)
	}
	session.window = null
	session.webView = null
	session.delegate = null
	session.initialURL = null
	session.navigation = null
	session.dialog = null
	session.fileSelection = null
	session.address = null
	session.status = null
	session.backButton = null
	session.forwardButton = null
	session.reloadButton = null
	cleanup(delegate, panel, browser, pending, selection, close)
}

function closeBrowser(session: Session): void {
	if (!NSThread.isMainThread) {
		NSOperationQueue.mainQueue.addOperationWithBlock(() => closeBrowser(session))
		return
	}
	teardown(session, true)
}

function navigationFailed(
	session: Session | undefined,
	browser: WKWebView,
	navigation: unknown,
	error: { domain: string; code: number },
): void {
	if (
		session == null ||
		!sameObject(browser, session.webView) ||
		!sameObject(navigation, session.navigation)
	) {
		return
	}
	if (error.domain === NSURLErrorDomain && error.code === NSURLErrorCancelled) {
		return
	}
	if (session.status != null) {
		session.status.stringValue = 'Could not load this page. Try Reload.'
		session.status.hidden = false
	}
}

function pageAlert(message: string, frame: WKFrameInfo, cancel: boolean): NSAlert {
	const alert = NSAlert.new()
	const host = String(frame.securityOrigin.host ?? '')
	alert.messageText = host.length === 0 ? 'Web page' : `Web page: ${host}`
	alert.informativeText = message
	alert.addButtonWithTitle('OK')
	if (cancel) {
		alert.addButtonWithTitle('Cancel').keyEquivalent = '\u{1b}'
	}
	return alert
}

function presentDialog(
	session: Session,
	alert: NSAlert,
	browser: WKWebView,
	completion: (response: number) => void,
): void {
	const panel = session.window
	if (
		!sameObject(browser, session.webView) ||
		panel == null ||
		!panel.isVisible() ||
		session.dialog != null ||
		session.fileSelection != null ||
		panel.attachedSheet != null
	) {
		completion(NSModalResponseCancel)
		return
	}
	const pending: PendingSheet = {
		window: alert.window,
		claimed: false,
		deliver: (response) => response,
		complete: completion,
	}
	session.dialog = pending
	panel.beginSheetCompletionHandler(alert.window, (response: number) => {
		const current =
			session.dialog === pending &&
			sameObject(browser, session.webView) &&
			sameObject(panel, session.window)
		if (current) {
			session.dialog = null
		}
		finishSheet(pending, current ? response : NSModalResponseCancel, panel)
	})
}

let DelegateClass: { alloc(): { init(): NSObject } } | undefined

function delegateClass(): { alloc(): { init(): NSObject } } {
	DelegateClass ??= NSObject.extend(
		{
			windowWillClose(this: NSObject, notification: { object: unknown }) {
				const session = sessionOf(this)
				if (session == null || !sameObject(notification?.object, session.window)) {
					return
				}
				teardown(session, false)
			},
			webViewDecidePolicyForNavigationActionDecisionHandler(
				this: NSObject,
				browser: WKWebView,
				action: WKNavigationAction,
				decisionHandler: (policy: number) => void,
			) {
				const session = sessionOf(browser)
				const url = action?.request?.URL ?? null
				if (session == null || !sameObject(browser, session.webView) || url == null) {
					decisionHandler(WKNavigationActionPolicy.Cancel)
					return
				}
				const scheme = String(url.scheme ?? '').toLowerCase()
				const targetFrame: unknown = action.targetFrame
				const frame =
					typeof targetFrame === 'object' && targetFrame !== null
						? (targetFrame as TargetFrame)
						: null
				const mainFrame =
					frame == null
						? false
						: typeof frame.isMainFrame === 'function'
							? frame.isMainFrame()
							: frame.isMainFrame === true
				const childDocument = !mainFrame && (scheme === 'about' || scheme === 'data')
				decisionHandler(
					isHTTP(url) || childDocument
						? WKNavigationActionPolicy.Allow
						: WKNavigationActionPolicy.Cancel,
				)
			},
			webViewCreateWebViewWithConfigurationForNavigationActionWindowFeatures(
				this: NSObject,
				browser: WKWebView,
				_configuration: WKWebViewConfiguration,
				action: WKNavigationAction,
				_windowFeatures: WKWindowFeatures,
			): WKWebView | null {
				const session = sessionOf(this)
				const url = action?.request?.URL ?? null
				if (
					session == null ||
					!sameObject(browser, session.webView) ||
					action?.targetFrame != null ||
					!isHTTP(url)
				) {
					return null
				}
				session.navigation = browser.loadRequest(action.request)
				return null
			},
			webViewRunJavaScriptAlertPanelWithMessageInitiatedByFrameCompletionHandler(
				this: NSObject,
				browser: WKWebView,
				message: string,
				frame: WKFrameInfo,
				completionHandler: () => void,
			) {
				const session = sessionOf(browser)
				const kept = copyBlock(completionHandler)
				if (session == null) {
					completionHandler()
					if (kept != null) _Block_release(kept)
					return
				}
				presentDialog(session, pageAlert(message, frame, false), browser, () => {
					completionHandler()
					if (kept != null) _Block_release(kept)
				})
			},
			webViewRunJavaScriptConfirmPanelWithMessageInitiatedByFrameCompletionHandler(
				this: NSObject,
				browser: WKWebView,
				message: string,
				frame: WKFrameInfo,
				completionHandler: (accepted: boolean) => void,
			) {
				const session = sessionOf(browser)
				const kept = copyBlock(completionHandler)
				if (session == null) {
					completionHandler(false)
					if (kept != null) _Block_release(kept)
					return
				}
				presentDialog(session, pageAlert(message, frame, true), browser, (response) => {
					completionHandler(response === NSAlertFirstButtonReturn)
					if (kept != null) _Block_release(kept)
				})
			},
			webViewRunJavaScriptTextInputPanelWithPromptDefaultTextInitiatedByFrameCompletionHandler(
				this: NSObject,
				browser: WKWebView,
				prompt: string,
				defaultText: string | null,
				frame: WKFrameInfo,
				completionHandler: (value: string | null) => void,
			) {
				const session = sessionOf(browser)
				const kept = copyBlock(completionHandler)
				if (session == null) {
					completionHandler(null)
					if (kept != null) _Block_release(kept)
					return
				}
				const alert = pageAlert(prompt, frame, true)
				const input = NSTextField.alloc().initWithFrame({
					origin: { x: 0, y: 0 },
					size: { width: 320, height: 24 },
				})
				input.stringValue = defaultText ?? ''
				setAccessibilityLabel(input, 'Response')
				alert.accessoryView = input
				alert.window.initialFirstResponder = input
				presentDialog(session, alert, browser, (response) => {
					completionHandler(response === NSAlertFirstButtonReturn ? input.stringValue : null)
					if (kept != null) _Block_release(kept)
				})
			},
			webViewRunOpenPanelWithParametersInitiatedByFrameCompletionHandler(
				this: NSObject,
				browser: WKWebView,
				parameters: WKOpenPanelParameters,
				frame: WKFrameInfo,
				completionHandler: (urls: unknown) => void,
			) {
				const session = sessionOf(browser)
				const owner = session?.window ?? null
				const kept = copyBlock(completionHandler)
				if (
					session == null ||
					!sameObject(browser, session.webView) ||
					owner == null ||
					!owner.isVisible() ||
					session.dialog != null ||
					session.fileSelection != null ||
					owner.attachedSheet != null
				) {
						completionHandler(null)
					if (kept != null) _Block_release(kept)
					return
				}
				const panel = NSOpenPanel.openPanel()
				const host = String(frame.securityOrigin.host ?? '')
				panel.message =
					host.length === 0 ? 'Choose files for this web page' : `Choose files for web page: ${host}`
				panel.prompt = 'Choose'
				panel.allowsMultipleSelection = parameters.allowsMultipleSelection
				panel.canChooseDirectories = parameters.allowsDirectories
				panel.canChooseFiles = !parameters.allowsDirectories
				panel.canCreateDirectories = false
				// WKOpenPanelParameters has no public accepted-content-type property.
				const selection: PendingSheet = {
					window: panel,
					claimed: false,
					deliver: (response) => (response === NSModalResponseOK ? panel.URLs : null),
					complete: (urls) => {
						completionHandler(urls)
						if (kept != null) _Block_release(kept)
					},
				}
				session.fileSelection = selection
				panel.beginSheetModalForWindowCompletionHandler(owner, (response: number) => {
					const current =
						session.fileSelection === selection &&
						sameObject(browser, session.webView) &&
						sameObject(owner, session.window)
					if (current) {
						session.fileSelection = null
					}
					finishSheet(selection, current ? response : NSModalResponseCancel, owner)
				})
			},
			webViewDidStartProvisionalNavigation(
				this: NSObject,
				browser: WKWebView,
				navigation: unknown,
			) {
				const session = sessionOf(browser)
				if (session == null || !sameObject(browser, session.webView)) {
					return
				}
				cancelPanels(session)
				session.navigation = navigation
				if (session.status != null) {
					session.status.hidden = true
					session.status.stringValue = ''
				}
			},
			webViewDidFinishNavigation(this: NSObject, browser: WKWebView, navigation: unknown) {
				const session = sessionOf(this)
				if (
					session == null ||
					!sameObject(browser, session.webView) ||
					!sameObject(navigation, session.navigation)
				) {
					return
				}
				if (session.status != null) {
					session.status.hidden = true
				}
				updateChrome(session)
			},
			webViewDidFailProvisionalNavigationWithError(
				this: NSObject,
				browser: WKWebView,
				navigation: unknown,
				error: { domain: string; code: number },
			) {
				navigationFailed(sessionOf(browser), browser, navigation, error)
			},
			webViewDidFailNavigationWithError(
				this: NSObject,
				browser: WKWebView,
				navigation: unknown,
				error: { domain: string; code: number },
			) {
				navigationFailed(sessionOf(browser), browser, navigation, error)
			},
			webViewWebContentProcessDidTerminate(this: NSObject, browser: WKWebView) {
				const session = sessionOf(this)
				if (session == null || !sameObject(browser, session.webView)) {
					return
				}
				cancelPanels(session)
				if (session.status != null) {
					session.status.stringValue = 'Page stopped. Try Reload.'
					session.status.hidden = false
				}
			},
			observeValueForKeyPathOfObjectChangeContext(
				this: NSObject,
				_keyPath: unknown,
				object: unknown,
				_change: unknown,
				_context: unknown,
			) {
				const session = sessionOf(object)
				if (session == null) {
					return
				}
				// Match the Swift DispatchQueue.main.async boundary before mutating.
				NSOperationQueue.mainQueue.addOperationWithBlock(() => {
					if (sameObject(object, session.webView)) {
						updateChrome(session)
					}
				})
			},
			goBack(this: NSObject, _sender: unknown) {
				const session = sessionOf(this)
				const browser = session?.webView
				if (session != null && browser != null && browser.canGoBack) {
					session.navigation = browser.goBack()
				}
			},
			goForward(this: NSObject, _sender: unknown) {
				const session = sessionOf(this)
				const browser = session?.webView
				if (session != null && browser != null && browser.canGoForward) {
					session.navigation = browser.goForward()
				}
			},
			reloadOrStop(this: NSObject, _sender: unknown) {
				const session = sessionOf(this)
				const browser = session?.webView
				if (session == null || browser == null) {
					return
				}
				if (browser.isLoading()) {
					browser.stopLoading()
				} else if (browser.URL != null) {
					session.navigation = browser.reload()
				} else if (session.initialURL != null) {
					session.navigation = browser.loadRequest(NSURLRequest.requestWithURL(session.initialURL))
				}
			},
			closeAction(this: NSObject, _sender: unknown) {
				const session = sessionOf(this)
				if (session != null) {
					closeBrowser(session)
				}
			},
		},
		{
			name: 'XplatInAppBrowserDelegate',
			protocols: [NSWindowDelegate, WKNavigationDelegate, WKUIDelegate],
			exposedMethods: {
				'observeValueForKeyPath:ofObject:change:context:': {
					params: [interop.types.id, interop.types.id, interop.types.id, interop.types.id],
					returns: interop.types.void,
				},
				'goBack:': { params: [interop.types.id], returns: interop.types.void },
				'goForward:': { params: [interop.types.id], returns: interop.types.void },
				'reloadOrStop:': { params: [interop.types.id], returns: interop.types.void },
				'closeAction:': { params: [interop.types.id], returns: interop.types.void },
			},
		},
	) as unknown as DelegateConstructor
	return DelegateClass
}

interface TargetFrame {
	isMainFrame?: boolean | (() => boolean)
}

// Bridge globals materialize only on a real AppKit host; this named shape is
// the bounded contract this leaf probes before presenting.
interface BrowserGlobals {
	dlopen?: unknown
	NSApp?: unknown
	WKWebView?: unknown
	NSObject?: unknown
}

interface DelegateConstructor {
	alloc(): { init(): NSObject }
}

function openBrowserWindow(session: Session, value: string): boolean {
	if (!NSThread.isMainThread || (globalThis as BrowserGlobals).NSApp == null) {
		return false
	}
	const url = addressURL(value)
	if (url == null) {
		return false
	}
	closeBrowser(session)
	const configuration = WKWebViewConfiguration.new()
	const browser = WKWebView.alloc().initWithFrameConfiguration(
		{ origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
		configuration,
	)
	browser.allowsBackForwardNavigationGestures = true
	const delegate = delegateClass().alloc().init()
	session.delegate = delegate
	sessions.add(session)
	browser.navigationDelegate = delegate as unknown as WKNavigationDelegate
	browser.UIDelegate = delegate as unknown as WKUIDelegate
	const mask =
		NSWindowStyleMask.Titled |
		NSWindowStyleMask.Closable |
		NSWindowStyleMask.Miniaturizable |
		NSWindowStyleMask.Resizable
	const panel = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
		{ origin: { x: 0, y: 0 }, size: { width: 900, height: 640 } },
		mask,
		NSBackingStoreType.Buffered,
		false,
	)
	panel.releasedWhenClosed = false
	panel.minSize = { width: 480, height: 320 }
	panel.title = 'Browser'
	panel.delegate = delegate as unknown as NSWindowDelegate
	session.window = panel
	session.webView = browser
	session.initialURL = url

	const back = NSButton.buttonWithTitleTargetAction('Back', delegate, 'goBack:')
	const forward = NSButton.buttonWithTitleTargetAction('Forward', delegate, 'goForward:')
	const reload = NSButton.buttonWithTitleTargetAction('Reload', delegate, 'reloadOrStop:')
	const closeButton = NSButton.buttonWithTitleTargetAction('Close', delegate, 'closeAction:')
	const location = NSTextField.labelWithString(value)
	location.selectable = true
	location.lineBreakMode = NSLineBreakMode.TruncatingMiddle
	setAccessibilityLabel(location, 'Page address')
	location.setContentHuggingPriorityForOrientation(
		NSLayoutPriorityDefaultLow,
		NSLayoutConstraintOrientation.Horizontal,
	)
	location.setContentCompressionResistancePriorityForOrientation(
		NSLayoutPriorityDefaultLow,
		NSLayoutConstraintOrientation.Horizontal,
	)
	const toolbar = NSStackView.stackViewWithViews([back, forward, reload, location, closeButton])
	toolbar.orientation = NSUserInterfaceLayoutOrientation.Horizontal
	toolbar.alignment = NSLayoutAttribute.CenterY
	toolbar.spacing = 8
	const feedback = NSTextField.labelWithString('')
	feedback.hidden = true
	const chrome = NSStackView.stackViewWithViews([toolbar, feedback])
	chrome.orientation = NSUserInterfaceLayoutOrientation.Vertical
	chrome.alignment = NSLayoutAttribute.Leading
	chrome.spacing = 4
	const root = NSView.new()
	panel.contentView = root
	for (const child of [chrome, browser]) {
		child.translatesAutoresizingMaskIntoConstraints = false
		root.addSubview(child)
	}
	NSLayoutConstraint.activateConstraints([
		chrome.topAnchor.constraintEqualToAnchorConstant(root.topAnchor, 8),
		chrome.leadingAnchor.constraintEqualToAnchorConstant(root.leadingAnchor, 8),
		chrome.trailingAnchor.constraintEqualToAnchorConstant(root.trailingAnchor, -8),
		toolbar.widthAnchor.constraintEqualToAnchorConstant(chrome.widthAnchor, 0),
		browser.topAnchor.constraintEqualToAnchorConstant(chrome.bottomAnchor, 8),
		browser.leadingAnchor.constraintEqualToAnchorConstant(root.leadingAnchor, 0),
		browser.trailingAnchor.constraintEqualToAnchorConstant(root.trailingAnchor, 0),
		browser.bottomAnchor.constraintEqualToAnchorConstant(root.bottomAnchor, 0),
	])
	session.address = location
	session.status = feedback
	session.backButton = back
	session.forwardButton = forward
	session.reloadButton = reload
	updateChrome(session)
	for (const key of OBSERVED_KEYS) {
		browser.addObserverForKeyPathOptionsContext(delegate, key, 5, null)
	}
	session.navigation = browser.loadRequest(NSURLRequest.requestWithURL(url))
	panel.center()
	panel.makeKeyAndOrderFront(null)
	NSApplication.sharedApplication.activateIgnoringOtherApps(true)
	return panel.isVisible()
}

/** Package-owned browser factory; absent bridges report unsupported rather
 *  than presenting or delegating to another application. */
export function createInAppBrowserFactory(): AppKitBrowserFactory | undefined {
	try {
		const globals = globalThis as BrowserGlobals
		const nsObject = globals.NSObject
		if (
			typeof globals.dlopen !== 'function' ||
			typeof globals.WKWebView !== 'function' ||
			typeof nsObject !== 'function' ||
			typeof (nsObject as { extend?: unknown }).extend !== 'function'
		) {
			return undefined
		}
	} catch {
		return undefined
	}
	return {
		accepts: (value: string) => addressURL(value) != null,
		create(): AppKitBrowserNative {
			const session: Session = {
				window: null,
				webView: null,
				delegate: null,
				dialog: null,
				fileSelection: null,
				initialURL: null,
				navigation: null,
				address: null,
				status: null,
				backButton: null,
				forwardButton: null,
				reloadButton: null,
			}
			return {
				open: (value: string) => openBrowserWindow(session, value),
				close: () => closeBrowser(session),
			}
		},
	}
}
