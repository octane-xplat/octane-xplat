import { harnessFontOptions } from './fonts'
import { announceAppKit } from './accessibility'
import { notifyAppKitListeners, subscribeAppKitEvent } from './platform-events'
import '@nativescript/macos-node-api'
import { createMacOSRoot } from '@octane-xplat/macos-renderer'
import type { UniversalComponent, UniversalRoot } from '@octane-xplat/macos-renderer'
import {
	NSApplication,
	NSApplicationActivationPolicy,
	NSApplicationDelegate,
	NSBundle,
	NSEventMask,
	NSFileManager,
	NSObject,
	NSPanel,
	NSPasteboard,
	NSRectEdge,
	NSScreen,
	NSSharingServicePicker,
	NSURL,
	NSUserDefaults,
	NSView,
	NSWindow,
	NSWindowDelegate,
	NSWindowOrderingMode,
	NSWindowStyleMask,
	NSWorkspace,
	NativeClass,
} from '@octane-xplat/platform/macos'

import type { NSClass } from '@octane-xplat/platform/macos'

const app = NSApplication.sharedApplication

const externalRunLoop = () =>
	(globalThis as typeof globalThis & {
		process?: { env?: Record<string, string | undefined> }
	}).process?.env?.OCTANE_MACOS_EXTERNAL_RUNLOOP === '1'

// The dev harness and the bundled app import this module as separate
// instances; windowing state is shared through globalThis so delegates
// registered by one copy see windows created by the other.

type WindowKind = 'regular' | 'dialog' | 'popup'

interface WindowSize {
	width: number
	height: number
}

type MacOSRoot = UniversalRoot & { __macosDebug?: { [key: string]: any } }

interface WindowControllerBase {
	window: NSWindow
	contentView?: NSView
	isClosed: boolean
	closed: Promise<void>
	onCloseRequested?: (() => boolean | void) | null
	setTitle(title: string): void
	close(): void
	__didClose(): void
}

interface AppKitWindowController extends WindowControllerBase {
	kind: WindowKind
	data: unknown
	root: MacOSRoot | null
	setSize(next: WindowSize): void
}

interface PlatformServices {
	appState: 'active' | 'inactive' | string
	appStateListeners: Set<() => void>
	windowResizeListeners: Set<(window?: NSWindow) => void>
	deepLinkListeners: Set<(url: string) => void>
	pendingUrls: string[]
	primaryWindow: NSWindow | null
}

interface MacosWindowingShared {
	resolver: ((data: unknown, controller: AppKitWindowController) => unknown) | null
	appDelegate: AppDelegate | null
	byNative: Map<NSWindow, WindowControllerBase>
	terminateAfterLastWindowClosed: boolean
	windowCloseHandlers: Map<NSWindow, () => void>
	parentWindows: Map<NSWindow, NSWindow>
	running: boolean
	eventPumpErrorReported: boolean
	applicationClosed: Promise<void>
	resolveApplicationClosed?: (value: void | PromiseLike<void>) => void
	platformServices: PlatformServices
}

interface OpenWindowOptions {
	kind?: string
	parent?: NSWindow | WindowControllerBase | null
	title?: string
	size?: WindowSize
	data?: unknown
	component?: UniversalComponent
	props?: unknown
	[key: string]: any
}

declare global {
	var __xplatMacosWindowing: MacosWindowingShared | undefined
	var __xplatAppKitOpenWindow: ((options: OpenWindowOptions) => AppKitWindowController) | undefined

	var __xplatAppKitMountSheet:
		| ((
				component: UniversalComponent,
				props: unknown,
				options?: OpenWindowOptions,
		  ) => AppKitWindowController)
		| undefined
}

const shared = (globalThis.__xplatMacosWindowing ??= {
	resolver: null,
	appDelegate: null,
	byNative: new Map(),
	terminateAfterLastWindowClosed: false,
} as MacosWindowingShared)

shared.terminateAfterLastWindowClosed ??= false

shared.windowCloseHandlers ??= new Map()
shared.parentWindows ??= new Map()
shared.running ??= true
shared.eventPumpErrorReported ??= false
shared.applicationClosed ??= new Promise((resolve) => {
	shared.resolveApplicationClosed = resolve
})

shared.platformServices ??= {
	appState: 'active',
	appStateListeners: new Set(),
	windowResizeListeners: new Set(),
	deepLinkListeners: new Set(),
	pendingUrls: [],
	primaryWindow: null,
}

const applicationClosed = shared.applicationClosed

function controllerFor(nativeWindow: NSWindow): WindowControllerBase | null {
	const direct = shared.byNative.get(nativeWindow)
	if (direct) {
		return direct
	}

	for (const [native, controller] of shared.byNative) {
		if (sameNativeWindow(native, nativeWindow)) {
			return controller
		}
	}

	return null
}

function sameNativeWindow(left: unknown, right: unknown): boolean {
	return (
		left === right ||
		Boolean((left as { isEqual?(value: unknown): boolean } | null)?.isEqual?.(right)) ||
		Boolean((right as { isEqual?(value: unknown): boolean } | null)?.isEqual?.(left))
	)
}

function closeOwnedWindows(parentWindow: NSWindow) {
	const children = [...shared.byNative.entries()]
		.filter(([nativeWindow]) => {
			const ownerWindow = shared.parentWindows.get(nativeWindow)
			return ownerWindow && sameNativeWindow(ownerWindow, parentWindow)
		})
		.map(([, controller]) => controller)

	for (const child of children) {
		try {
			child.close()
		} catch (error) {
			console.error('[macos] failed to close an owned window while closing its parent', error)
			try {
				child.window.close()
			} catch (closeError) {
				console.error('[macos] failed to close an owned AppKit window', closeError)
			}

			try {
				child.__didClose()
			} catch (cleanupError) {
				console.error('[macos] failed to finalize an owned window', cleanupError)
			}
		}
	}
}

function takeNativeWindowValue<T>(map: Map<NSWindow, T>, nativeWindow: NSWindow): T | null {
	const direct = map.get(nativeWindow)
	if (direct) {
		map.delete(nativeWindow)
		return direct
	}

	for (const [native, value] of map) {
		if (sameNativeWindow(native, nativeWindow)) {
			map.delete(native)
			return value
		}
	}

	return null
}

class AppDelegate extends NSObject {
	static ObjCProtocols = [NSApplicationDelegate, NSWindowDelegate]

	static {
		// ES class methods are non-enumerable, and the runtime only exports
		// enumerable prototype members as new ObjC methods — without this,
		// every delegate selector is invisible to AppKit. Same contract as
		// registerGestureClass in @octane-xplat/macos-renderer.
		for (const name of Object.getOwnPropertyNames(this.prototype)) {
			if (name === 'constructor') {
				continue
			}

			const descriptor = Object.getOwnPropertyDescriptor(this.prototype, name)!
			Object.defineProperty(this.prototype, name, { ...descriptor, enumerable: true })
		}

		NativeClass(this)
	}

	applicationDidFinishLaunching() {
		app.activateIgnoringOtherApps(true)
		// Under OCTANE_MACOS_EXTERNAL_RUNLOOP the host owns the event loop;
		// -stop: would terminate it and a JS pump would double-dispatch.
		// The stop+manual-pump handoff applies only to the stock app.run() path.
		if (externalRunLoop()) {
			return
		}

		app.stop(this)
		setTimeout(() => this.pumpEvents(), 0)
	}

	applicationShouldTerminateAfterLastWindowClosed() {
		return shared.terminateAfterLastWindowClosed
	}

	applicationDidBecomeActive() {
		shared.platformServices.appState = 'active'
		notifyAppKitListeners(shared.platformServices.appStateListeners, listener => listener())
	}

	applicationDidResignActive() {
		shared.platformServices.appState = 'inactive'
		notifyAppKitListeners(shared.platformServices.appStateListeners, listener => listener())
	}

	windowDidResize(notification: any) {
		const nativeWindow = notification.object
		notifyAppKitListeners(shared.platformServices.windowResizeListeners, listener => listener(nativeWindow))
	}

	applicationOpenURLs(_application: any, urls: any) {
		for (const url of urls ?? []) {
			const string = String(url?.absoluteString ?? url)
			if (shared.platformServices.deepLinkListeners.size === 0) {
				shared.platformServices.pendingUrls.push(string)
			} else {
				notifyAppKitListeners(shared.platformServices.deepLinkListeners, listener => listener(string))
			}
		}
	}

	windowShouldClose(nativeWindow: NSWindow) {
		const controller = controllerFor(nativeWindow)
		try {
			const shouldClose = controller?.onCloseRequested?.() !== false
			if (shouldClose) {
				closeOwnedWindows(nativeWindow)
			}

			return shouldClose
		} catch (error) {
			console.error('[macos] window close request handler failed', error)
			return false
		}
	}

	// A regular secondary window may outlive the main window. AppKit's
	// last-window policy handles application termination.
	windowWillClose(notification: any) {
		const nativeWindow = notification.object as NSWindow
		const controller = controllerFor(nativeWindow)
		if (controller) {
			controller.__didClose()
		} else {
			closeOwnedWindows(nativeWindow)
		}

		const closeHandler = takeNativeWindowValue(shared.windowCloseHandlers, nativeWindow)
		closeHandler?.()
	}

	applicationWillTerminate() {
		shared.running = false
		NSUserDefaults.standardUserDefaults.synchronize()
		for (const closeHandler of shared.windowCloseHandlers.values()) {
			closeHandler()
		}

		shared.windowCloseHandlers.clear()
		shared.resolveApplicationClosed?.()
	}

	pumpEvents() {
		let delay = 10
		try {
			const event = app.nextEventMatchingMaskUntilDateInModeDequeue(
				NSEventMask.Any,
				null,
				'kCFRunLoopDefaultMode',
				true,
			)

			if (event !== null) {
				app.sendEvent(event)
			}

			shared.eventPumpErrorReported = false
		} catch (error) {
			if (!shared.eventPumpErrorReported) {
				console.error('[macos] AppKit event pump failed; retrying', error)
				shared.eventPumpErrorReported = true
			}

			delay = 100
		}

		if (shared.running) {
			setTimeout(() => this.pumpEvents(), delay)
		}
	}
}

function appDelegate(): AppDelegate {
	if (!shared.appDelegate) {
		shared.appDelegate = AppDelegate.new() as AppDelegate
	}

	return shared.appDelegate
}

// Platform services seam — @octane-xplat/platform's macOS index reads
// `globalThis.__xplatAppKit` for anything the JS side cannot reach.
function installPlatformServices() {
	// The renderer seeds the same global with observeHover/showAnchoredPopup —
	// merge onto it rather than replacing or bailing on an early return.
	const bridge = ((globalThis as any).__xplatAppKit ??= {})
	const services = shared.platformServices
	const info = NSBundle.mainBundle.infoDictionary ?? {}
	let windowSizeSnapshot: (WindowSize & { orientation: 'portrait' | 'landscape' }) | undefined
	// Assigning would evaluate accessors once and freeze these live values.
	Object.defineProperties(bridge, Object.getOwnPropertyDescriptors({
		appInfo: {
			supported: true,
			version: (info as any).CFBundleShortVersionString ?? null,
			build: (info as any).CFBundleVersion ?? null,
			bundleId: NSBundle.mainBundle.bundleIdentifier ?? null,
		},
		get appState() {
			return services.appState
		},
		get windowSize() {
			const window =
				services.primaryWindow ?? app.keyWindow ?? app.mainWindow ?? app.windows?.firstObject

			const size = window?.contentView?.bounds?.size ?? window?.contentView?.frame?.size ??
				window?.frame?.size ?? { width: 0, height: 0 }
			const width = Number(size.width ?? 0)
			const height = Number(size.height ?? 0)
			if (!windowSizeSnapshot || windowSizeSnapshot.width !== width || windowSizeSnapshot.height !== height) {
				windowSizeSnapshot = {
					width,
					height,
					orientation: width >= height ? 'landscape' : 'portrait',
				}
			}
			return windowSizeSnapshot
		},
		announce(text: string) {
			if (shared.running) {
				announceAppKit(text, app)
			}
		},
		readClipboard() {
			const value = NSPasteboard.generalPasteboard.stringForType('public.utf8-plain-text')
			return value == null ? null : String(value)
		},
		writeClipboard(value: string) {
			const pasteboard = NSPasteboard.generalPasteboard
			pasteboard.clearContents()
			return Boolean(pasteboard.setStringForType(String(value), 'public.utf8-plain-text'))
		},
		shareContent({
			text,
			url,
			title,
			file,
		}: {
			text?: string
			url?: string
			title?: string
			file?: string
		}) {
			const anchor = services.primaryWindow?.contentView
			if (!anchor || typeof NSSharingServicePicker === 'undefined') {
				return 'unavailable'
			}

			try {
				let items
				if (typeof file === 'string') {
					if (!NSFileManager.defaultManager.fileExistsAtPath(file)) {
						return 'unavailable'
					}

					items = [NSURL.fileURLWithPath(file)]
				} else if (typeof url === 'string') {
					const nativeUrl = NSURL.URLWithString(url)
					if (!nativeUrl) {
						return 'unavailable'
					}

					items = [nativeUrl, String(title ?? url)]
				} else if (typeof text === 'string') {
					items = [text]
				} else {
					return 'unavailable'
				}

				const picker = NSSharingServicePicker.alloc().initWithItems(items)
				const bounds = anchor.bounds
				const rect = {
					origin: {
						x: bounds.origin.x + bounds.size.width / 2,
						y: bounds.origin.y + bounds.size.height / 2,
					},
					size: { width: 0, height: 0 },
				}

				const edges = (typeof NSRectEdge === 'object' && NSRectEdge ? NSRectEdge : {}) as {
					[key: string]: number
				}

				picker.showRelativeToRectOfViewPreferredEdge(rect, anchor, edges.MinYEdge ?? 1)
				return 'shared'
			} catch (error) {
				console.error('[macos] share picker presentation failed', error)
				return 'unavailable'
			}
		},
		openUrl(url: string) {
			const target = NSURL.URLWithString(String(url))
			if (!target) {
				return false
			}

			return Boolean(NSWorkspace.sharedWorkspace.openURL(target))
		},
		openPath(path: string) {
			return Boolean(NSWorkspace.sharedWorkspace.openURL(NSURL.fileURLWithPath(String(path))))
		},
		storageGet(key: string) {
			const value = NSUserDefaults.standardUserDefaults.stringForKey(String(key))
			return value == null ? null : String(value)
		},
		storageSet(key: string, value: string) {
			NSUserDefaults.standardUserDefaults.setObjectForKey(String(value), String(key))
		},
		storageRemove(key: string) {
			NSUserDefaults.standardUserDefaults.removeObjectForKey(String(key))
		},
		storageFlush() {
			return Boolean(NSUserDefaults.standardUserDefaults.synchronize())
		},
		onAppStateChange(listener: () => void) {
			return subscribeAppKitEvent(services.appStateListeners, listener).dispose
		},
		onWindowResize(listener: (window?: NSWindow) => void) {
			return subscribeAppKitEvent(services.windowResizeListeners, listener).dispose
		},
		onDeepLink(listener: (url: string) => void) {
			const registration = subscribeAppKitEvent(services.deepLinkListeners, listener)
			const pending = services.pendingUrls.splice(0)
			for (const [index, url] of pending.entries()) {
				try { registration.dispatch(url) } catch (error) {
					registration.dispose()
					// Restore the failed and unattempted URLs before any newer queue.
					services.pendingUrls = pending.slice(index).concat(services.pendingUrls)
					throw error
				}
			}
			return registration.dispose
		},
		consumeInitialUrl() {
			return services.pendingUrls.shift() ?? null
		},
	}))
}

try {
	installPlatformServices()
} catch (error) {
	console.error(
		'[macos] platform services seam failed to install; __xplatAppKit stays undefined',
		error,
	)
}

// `openWindow` from @octane-xplat/ui reaches the host through this global
// (windows.macos.ts). Function declaration hoisting covers the call order.
globalThis.__xplatAppKitOpenWindow ??= (options) => openWindow(options)

// Imperative sheets (sheet-service.macos) mount an arbitrary component in a
// dialog window; the controller's `closed` promise settles on dismissal.
globalThis.__xplatAppKitMountSheet ??= (component, props, options = {}) =>
	openWindow({ ...options, kind: 'dialog', component, props })

const REGULAR_STYLE =
	NSWindowStyleMask.Titled |
	NSWindowStyleMask.Closable |
	NSWindowStyleMask.Miniaturizable |
	NSWindowStyleMask.Resizable

function makeContentView(size: WindowSize): NSView {
	return NSView.alloc().initWithFrame({ origin: { x: 0, y: 0 }, size })
}

const WINDOW_KINDS = new Set(['regular', 'dialog', 'popup'])

function normalizeWindowSize(size: WindowSize | undefined, source = 'openWindow'): WindowSize {
	if (
		!size ||
		typeof size !== 'object' ||
		!Number.isFinite(size.width) ||
		!Number.isFinite(size.height) ||
		size.width <= 0 ||
		size.height <= 0
	) {
		throw new TypeError(`${source} size must have positive finite width and height`)
	}

	return { width: size.width, height: size.height }
}

function resolveParentWindow(
	parentOption: NSWindow | WindowControllerBase | null | undefined,
	kind: string,
): NSWindow | null {
	if (
		parentOption !== null &&
		typeof parentOption !== 'object' &&
		typeof parentOption !== 'function'
	) {
		throw new TypeError('openWindow parent must be an AppKit window or window controller')
	}

	if ((parentOption as any)?.isClosed) {
		throw new Error('openWindow cannot use a closed parent window')
	}

	const explicitParent =
		parentOption && 'window' in parentOption ? parentOption.window : (parentOption as NSWindow)

	const parentWindow = explicitParent ?? (kind === 'regular' ? null : app.keyWindow)

	if (kind !== 'regular' && !parentWindow) {
		throw new Error(`openWindow kind "${kind}" requires a parent window`)
	}

	if (
		kind === 'dialog' &&
		typeof (parentWindow?.beginSheetCompletionHandler ?? (parentWindow as any)?.beginSheet) !==
			'function'
	) {
		throw new TypeError('openWindow dialog parent must support AppKit sheets')
	}

	if (kind === 'popup' && typeof parentWindow?.addChildWindowOrdered !== 'function') {
		throw new TypeError('openWindow popup parent must support AppKit child windows')
	}

	return parentWindow
}

export function createAppKitWindow(options: { terminateAfterLastWindowClosed?: boolean } = {}) {
	if (options === null || typeof options !== 'object' || Array.isArray(options)) {
		throw new TypeError('createAppKitWindow options must be an object')
	}

	const terminateAfterLastWindowClosed = options.terminateAfterLastWindowClosed ?? false
	if (typeof terminateAfterLastWindowClosed !== 'boolean') {
		throw new TypeError('createAppKitWindow terminateAfterLastWindowClosed must be a boolean')
	}

	shared.terminateAfterLastWindowClosed = terminateAfterLastWindowClosed
	app.setActivationPolicy(NSApplicationActivationPolicy.Regular)

	const nativeWindow = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
		{ origin: { x: 0, y: 0 }, size: { width: 640, height: 420 } },
		REGULAR_STYLE,
		2,
		false,
	)

	nativeWindow.title = 'Octane macOS spike'
	nativeWindow.releasedWhenClosed = false

	nativeWindow.center()
	nativeWindow.delegate = appDelegate()
	app.delegate = shared.appDelegate as unknown as NSApplicationDelegate
	shared.platformServices.primaryWindow ??= nativeWindow

	const contentView = makeContentView({ width: 640, height: 420 })
	// Pin the content size as a required constraint. Without it, every
	// required child-pin chain hands the solver a path where a nested
	// view's hugging priority (750) outranks the window↔content constraint
	// (WindowSizeStayPut, 500) — and AppKit resizes the window to the
	// content's fitting size. The pins track the last applied size so
	// explicit/user resizes still take: a fixed constant would lock the
	// window at 640x420 forever.
	const widthPin = contentView.widthAnchor.constraintEqualToConstant(640)
	const heightPin = contentView.heightAnchor.constraintEqualToConstant(420)
	widthPin.active = true
	heightPin.active = true
	subscribeAppKitEvent(shared.platformServices.windowResizeListeners, (resized) => {
		if (resized !== nativeWindow) {
			return
		}

		const size = nativeWindow.contentView?.bounds?.size
		if (!size) {
			return
		}

		widthPin.constant = Number(size.width)
		heightPin.constant = Number(size.height)
	})
	nativeWindow.contentView = contentView
	let resolveWindowClosed!: () => void
	const windowClosed = new Promise<void>((resolve) => {
		resolveWindowClosed = resolve
	})

	shared.windowCloseHandlers.set(nativeWindow, resolveWindowClosed)
	nativeWindow.makeKeyAndOrderFront(app)

	return {
		app,
		window: nativeWindow,
		contentView,
		applicationClosed,
		windowClosed,
		delegate: shared.appDelegate,
	}
}

/**
 * Resize a window once to its content's fitting size — call after the first
 * render. Floored at the default content size (scroll views report no
 * intrinsic size, so an unclamped fitting can collapse) and capped at the
 * screen's visible height. One-shot: the window stays resizable afterwards.
 */
export function fitWindowToContent(
	nativeWindow: NSWindow | null | undefined,
	floor = { width: 640, height: 420 },
) {
	const contentView = nativeWindow?.contentView
	const fit = contentView?.fittingSize
	const width = Number(fit?.width)
	const height = Number(fit?.height)
	if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
		return
	}

	const screenHeight = Number(
		nativeWindow?.screen?.visibleFrame?.size?.height ??
			NSScreen.mainScreen?.visibleFrame?.size?.height ??
			0,
	)

	nativeWindow?.setContentSize({
		width: Math.max(floor.width, Math.ceil(width)),
		height: Math.max(
			floor.height,
			Math.min(Math.ceil(height), screenHeight > 0 ? screenHeight : height),
		),
	})
}

/** Install the app-owned resolver that maps openWindow data to a component. */
export function setWindowContentResolver(
	resolve: ((data: unknown, controller: AppKitWindowController) => unknown) | null,
) {
	if (resolve !== null && typeof resolve !== 'function') {
		throw new TypeError('setWindowContentResolver expects a function or null')
	}

	shared.resolver = resolve
}

/**
 * Open a macOS window hosting its own Octane root. `kind` is a behavior
 * contract: 'regular' opens an independent window, 'dialog' presents as a
 * sheet on the parent (default: key window), 'popup' is a non-activating
 * child panel. Requested size and title are hints.
 */
export function openWindow(options: OpenWindowOptions = {}): AppKitWindowController {
	if (options === null || typeof options !== 'object' || Array.isArray(options)) {
		throw new TypeError('openWindow options must be an object')
	}

	if (!shared.running) {
		throw new Error('Cannot open a macOS window after application termination has started')
	}

	const kind = options.kind ?? 'regular'
	const parentOption = options.parent ?? null
	if (!WINDOW_KINDS.has(kind)) {
		throw new RangeError(`Unsupported macOS window kind: ${String(kind)}`)
	}

	const parentWindow = resolveParentWindow(parentOption, kind)
	const defaultSize = kind === 'regular' ? { width: 480, height: 320 } : { width: 360, height: 200 }

	const size = normalizeWindowSize(options.size ?? defaultSize)

	const styleMask =
		kind === 'regular'
			? REGULAR_STYLE
			: kind === 'popup'
				? (NSWindowStyleMask.NonactivatingPanel ?? 128) |
					NSWindowStyleMask.Titled |
					NSWindowStyleMask.Closable
				: NSWindowStyleMask.Titled | NSWindowStyleMask.Closable

	let nativeWindow: NSWindow | undefined
	let controller: AppKitWindowController | undefined
	try {
		nativeWindow = ((kind === 'popup' ? NSPanel : NSWindow) as NSClass<NSWindow>)
			.alloc()
			.initWithContentRectStyleMaskBackingDefer(
				{ origin: { x: 0, y: 0 }, size },
				styleMask,
				2,
				false,
			)

		if (!nativeWindow) {
			throw new Error('AppKit failed to initialize the window')
		}

		nativeWindow.title = String(options.title ?? 'Octane window')
		nativeWindow.releasedWhenClosed = false
		nativeWindow.delegate = appDelegate()
		nativeWindow.contentView = makeContentView(size)

		let resolveWindowClosed!: () => void
		controller = {
			kind: kind as WindowKind,
			window: nativeWindow,
			data: options.data ?? null,
			root: null,
			isClosed: false,
			closed: new Promise<void>((resolve) => {
				resolveWindowClosed = resolve
			}),
			onCloseRequested: null,
			setTitle(title: string) {
				nativeWindow!.title = String(title)
			},
			setSize(next: WindowSize) {
				nativeWindow!.setContentSize(normalizeWindowSize(next, 'setSize'))
			},
			// Explicit close is a command; NSWindow.close() skips windowShouldClose,
			// which is reserved for user/performClose requests and their veto callback.
			close() {
				if (controller!.isClosed) {
					return
				}

				closeOwnedWindows(nativeWindow!)
				if (kind === 'dialog' && parentWindow) {
					parentWindow.endSheet(nativeWindow!)
				} else {
					nativeWindow!.close()
				}

				controller!.__didClose()
			},
			__didClose() {
				if (controller!.isClosed) {
					return
				}

				controller!.isClosed = true
				try {
					closeOwnedWindows(nativeWindow!)
				} catch (error) {
					console.error('[macos] failed to close owned windows while closing a window', error)
				}

				shared.byNative.delete(nativeWindow!)
				shared.parentWindows.delete(nativeWindow!)
				const root = controller!.root
				controller!.root = null
				try {
					root?.unmount()
				} catch (error) {
					console.error('[macos] window root unmount failed', error)
				} finally {
					resolveWindowClosed()
				}
			},
		}

		shared.byNative.set(nativeWindow, controller)
		if (kind !== 'regular') {
			shared.parentWindows.set(nativeWindow, parentWindow!)
		}

		const component =
			options.component ??
			(typeof shared.resolver === 'function' ? shared.resolver(controller.data, controller) : null)

		if (typeof component !== 'function') {
			throw new Error(
				options.component == null
					? 'Install setWindowContentResolver() before calling openWindow()'
					: 'openWindow component must resolve to a component',
			)
		}

		controller.root = createMacOSRoot(nativeWindow.contentView, harnessFontOptions) as MacOSRoot
		controller.root.render(
			component as UniversalComponent,
			options.props ?? { data: controller.data, controller },
		)

		if (kind === 'dialog') {
			const beginSheet =
				parentWindow!.beginSheetCompletionHandler ?? (parentWindow as any).beginSheet

			beginSheet.call(parentWindow, nativeWindow, null as any)
		} else if (kind === 'popup') {
			parentWindow!.addChildWindowOrdered(nativeWindow, NSWindowOrderingMode?.Above ?? 1)
			nativeWindow.orderFront(null)
		} else {
			nativeWindow.center()
			nativeWindow.makeKeyAndOrderFront(app)
		}
	} catch (error) {
		try {
			controller?.__didClose()
		} catch (cleanupError) {
			console.error('[macos] failed to clean up a window after setup failed', cleanupError)
		}

		try {
			nativeWindow?.close()
		} catch (closeError) {
			console.error('[macos] failed to close a window after setup failed', closeError)
		}

		throw error
	}

	return controller
}

/**
 * Create a bare AppKit window for a non-Octane host view (currently the desktop
 * WKWebView bridge). Unlike openWindow, this does not create a universal root.
 */
export function createHostedWindow(options: OpenWindowOptions = {}) {
	if (options === null || typeof options !== 'object' || Array.isArray(options)) {
		throw new TypeError('createHostedWindow options must be an object')
	}

	if (!shared.running) {
		throw new Error('Cannot open a macOS window after application termination has started')
	}

	const kind = options.kind ?? 'regular'
	if (!['regular', 'dialog'].includes(kind)) {
		throw new RangeError(`Unsupported hosted macOS window kind: ${String(kind)}`)
	}

	const parentWindow = kind === 'dialog' ? resolveParentWindow(options.parent, kind) : null
	const size = normalizeWindowSize(
		options.size ?? { width: 640, height: 480 },
		'createHostedWindow',
	)

	const nativeWindow = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
		{ origin: { x: 0, y: 0 }, size },
		REGULAR_STYLE,
		2,
		false,
	)

	nativeWindow.title = String(options.title ?? 'Octane window')
	nativeWindow.releasedWhenClosed = false
	nativeWindow.delegate = appDelegate()
	nativeWindow.contentView = makeContentView(size)
	if (parentWindow) {
		shared.parentWindows.set(nativeWindow, parentWindow)
	}

	let resolveWindowClosed!: () => void
	const closed = new Promise<void>((resolve) => {
		resolveWindowClosed = resolve
	})

	let isClosed = false
	const finalizeClose = () => {
		if (isClosed) {
			return
		}

		isClosed = true
		shared.windowCloseHandlers.delete(nativeWindow)
		shared.byNative.delete(nativeWindow)
		shared.parentWindows.delete(nativeWindow)
		resolveWindowClosed()
	}

	const controller = {
		window: nativeWindow,
		contentView: nativeWindow.contentView,
		closed,
		get isClosed() {
			return isClosed
		},
		setTitle(title: string) {
			nativeWindow.title = String(title)
		},
		close() {
			if (isClosed) {
				return
			}

			if (kind === 'dialog' && parentWindow) {
				parentWindow.endSheet(nativeWindow)
			} else {
				nativeWindow.close()
			}

			finalizeClose()
		},
		__didClose() {
			finalizeClose()
		},
	}

	shared.byNative.set(nativeWindow, controller)
	shared.windowCloseHandlers.set(nativeWindow, finalizeClose)

	if (kind === 'dialog' && parentWindow) {
		const beginSheet = parentWindow.beginSheetCompletionHandler ?? (parentWindow as any).beginSheet
		beginSheet.call(parentWindow, nativeWindow, null as any)
	} else {
		nativeWindow.center()
		nativeWindow.makeKeyAndOrderFront(app)
	}

	return controller
}

/** Snapshot/press handles for every secondary window, used by dev automation. */
export function debugWindows() {
	return [...shared.byNative.entries()].map(([nativeWindow, controller]) => ({
		title: String(nativeWindow.title ?? ''),
		debug: (controller as AppKitWindowController).root?.__macosDebug ?? null,
	}))
}
