import '@nativescript/macos-node-api'
import { createMacOSRoot } from '@xplat/macos/renderer'

const app = NSApplication.sharedApplication

// The dev harness and the bundled app import this module as separate
// instances; windowing state is shared through globalThis so delegates
// registered by one copy see windows created by the other.

const shared = (globalThis.__xplatMacosWindowing ??= {
	resolver: null,
	appDelegate: null,
	byNative: new Map(),
	terminateAfterLastWindowClosed: false,
})

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
	appearanceListeners: new Set(),
	appearanceObserved: false,
}

const applicationClosed = shared.applicationClosed

function controllerFor(nativeWindow) {
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

function sameNativeWindow(left, right) {
	return left === right || Boolean(left?.isEqual?.(right)) || Boolean(right?.isEqual?.(left))
}

function closeOwnedWindows(parentWindow) {
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

function takeNativeWindowValue(map, nativeWindow) {
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
		NativeClass(this)
	}

	applicationDidFinishLaunching() {
		app.activateIgnoringOtherApps(true)
		app.stop(this)
		setTimeout(() => this.pumpEvents(), 0)
	}

	applicationShouldTerminateAfterLastWindowClosed() {
		return shared.terminateAfterLastWindowClosed
	}

	applicationDidBecomeActive() {
		shared.platformServices.appState = 'active'
		for (const listener of shared.platformServices.appStateListeners) {
			listener()
		}
	}

	applicationDidResignActive() {
		shared.platformServices.appState = 'inactive'
		for (const listener of shared.platformServices.appStateListeners) {
			listener()
		}
	}

	windowDidResize() {
		for (const listener of shared.platformServices.windowResizeListeners) {
			listener()
		}
	}

	applicationOpenURLs(application, urls) {
		for (const url of urls ?? []) {
			const string = String(url?.absoluteString ?? url)
			if (shared.platformServices.deepLinkListeners.size === 0) {
				shared.platformServices.pendingUrls.push(string)
			} else {
				for (const listener of shared.platformServices.deepLinkListeners) {
					listener(string)
				}
			}
		}
	}

	// KVO — `observeValueForKeyPath:ofObject:change:context:` on the shared
	// delegate, registered for NSApplication.effectiveAppearance below.
	observeValueForKeyPathOfObjectChangeContext(keyPath) {
		if (keyPath === 'effectiveAppearance') {
			shared.platformServices.appearanceListeners?.forEach((listener) => listener())
		}
	}

	windowShouldClose(nativeWindow) {
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
	windowWillClose(notification) {
		const nativeWindow = notification.object
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

function appDelegate() {
	if (!shared.appDelegate) {
		shared.appDelegate = AppDelegate.new()
	}

	return shared.appDelegate
}

// Platform services seam — @octane-xplat/platform's macOS index reads
// `globalThis.__xplatAppKit` for anything the JS side cannot reach.
function installPlatformServices() {
	if (globalThis.__xplatAppKit) return

	const services = shared.platformServices
	const info = NSBundle.mainBundle.infoDictionary ?? {}
	globalThis.__xplatAppKit = {
		appInfo: {
			supported: true,
			version: info.CFBundleShortVersionString ?? null,
			build: info.CFBundleVersion ?? null,
			bundleId: NSBundle.mainBundle.bundleIdentifier ?? null,
		},
		get appState() { return services.appState },
		get windowSize() {
			const frame = services.primaryWindow?.contentView?.frame ?? { size: { width: 0, height: 0 } }
			return {
				width: frame.size.width,
				height: frame.size.height,
				orientation: frame.size.width >= frame.size.height ? 'landscape' : 'portrait',
			}
		},
		readClipboard() {
			const value = NSPasteboard.generalPasteboard.stringForType('public.utf8-plain-text')
			return value == null ? null : String(value)
		},
		writeClipboard(value) {
			const pasteboard = NSPasteboard.generalPasteboard
			pasteboard.clearContents()
			return Boolean(pasteboard.setStringForType(String(value), 'public.utf8-plain-text'))
		},
		openUrl(url) {
			const target = NSURL.URLWithString(String(url))
			if (!target) return false
			return Boolean(NSWorkspace.sharedWorkspace.openURL(target))
		},
		getColorScheme() {
			const appearance = app.effectiveAppearance
			const match = appearance?.bestMatchFromAppearancesWithNames?.(['NSAppearanceNameDarkAqua'])
			return match === 'NSAppearanceNameDarkAqua' ? 'dark' : 'light'
		},
		onAppearanceChange(listener) {
			services.appearanceListeners.add(listener)
			if (!services.appearanceObserved) {
				services.appearanceObserved = true
				app.addObserverForKeyPathOptionsContext(appDelegate(), 'effectiveAppearance', 0, null)
			}
			return () => services.appearanceListeners.delete(listener)
		},
		storageGet(key) {
			const value = NSUserDefaults.standardUserDefaults.stringForKey(String(key))
			return value == null ? null : String(value)
		},
		storageSet(key, value) {
			NSUserDefaults.standardUserDefaults.setObjectForKey(String(value), String(key))
		},
		storageRemove(key) {
			NSUserDefaults.standardUserDefaults.removeObjectForKey(String(key))
		},
		onAppStateChange(listener) {
			services.appStateListeners.add(listener)
			return () => services.appStateListeners.delete(listener)
		},
		onWindowResize(listener) {
			services.windowResizeListeners.add(listener)
			return () => services.windowResizeListeners.delete(listener)
		},
		onDeepLink(listener) {
			services.deepLinkListeners.add(listener)
			for (const pending of services.pendingUrls.splice(0)) {
				listener(pending)
			}
			return () => services.deepLinkListeners.delete(listener)
		},
		consumeInitialUrl() {
			return services.pendingUrls.shift() ?? null
		},
	}
}

try {
	installPlatformServices()
} catch (error) {
	console.error('[macos] platform services seam failed to install; __xplatAppKit stays undefined', error)
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

function makeContentView(size) {
	return NSView.alloc().initWithFrame({ origin: { x: 0, y: 0 }, size })
}

const WINDOW_KINDS = new Set(['regular', 'dialog', 'popup'])

function normalizeWindowSize(size, source = 'openWindow') {
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

function resolveParentWindow(parentOption, kind) {
	if (
		parentOption !== null &&
		typeof parentOption !== 'object' &&
		typeof parentOption !== 'function'
	) {
		throw new TypeError('openWindow parent must be an AppKit window or window controller')
	}

	if (parentOption?.isClosed) {
		throw new Error('openWindow cannot use a closed parent window')
	}

	const explicitParent =
		parentOption && 'window' in parentOption ? parentOption.window : parentOption

	const parentWindow = explicitParent ?? (kind === 'regular' ? null : app.keyWindow)

	if (kind !== 'regular' && !parentWindow) {
		throw new Error(`openWindow kind "${kind}" requires a parent window`)
	}

	if (
		kind === 'dialog' &&
		typeof (parentWindow?.beginSheetCompletionHandler ?? parentWindow?.beginSheet) !== 'function'
	) {
		throw new TypeError('openWindow dialog parent must support AppKit sheets')
	}

	if (kind === 'popup' && typeof parentWindow?.addChildWindowOrdered !== 'function') {
		throw new TypeError('openWindow popup parent must support AppKit child windows')
	}

	return parentWindow
}

export function createAppKitWindow(options = {}) {
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
	// The content is fully constraint-driven (stacks + anchors); AppKit can
	// re-fit the window to content on commits — parity-shots.mjs sends the
	// `pin-window` command to re-assert 640x420 before capturing. Min/max
	// size at least keeps user resizes inside the shared viewport contract.
	nativeWindow.contentMinSize = { width: 640, height: 420 }
	nativeWindow.contentMaxSize = { width: 640, height: 420 }
	nativeWindow.center()
	nativeWindow.delegate = appDelegate()
	app.delegate = shared.appDelegate
	shared.platformServices.primaryWindow ??= nativeWindow

	const contentView = makeContentView({ width: 640, height: 420 })
	nativeWindow.contentView = contentView
	let resolveWindowClosed
	const windowClosed = new Promise((resolve) => {
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

/** Install the app-owned resolver that maps openWindow data to a component. */
export function setWindowContentResolver(resolve) {
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
export function openWindow(options = {}) {
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
	const defaultSize =
		kind === 'regular' ? { width: 480, height: 320 } : { width: 360, height: 200 }

	const size = normalizeWindowSize(options.size ?? defaultSize)

	const styleMask =
		kind === 'regular'
			? REGULAR_STYLE
			: kind === 'popup'
				? (NSWindowStyleMask.NonactivatingPanel ?? 128) |
					NSWindowStyleMask.Titled |
					NSWindowStyleMask.Closable
				: NSWindowStyleMask.Titled | NSWindowStyleMask.Closable

	let nativeWindow
	let controller
	try {
		nativeWindow = (kind === 'popup' ? NSPanel : NSWindow)
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

		let resolveWindowClosed
		controller = {
			kind,
			window: nativeWindow,
			data: options.data ?? null,
			root: null,
			isClosed: false,
			closed: new Promise((resolve) => {
				resolveWindowClosed = resolve
			}),
			onCloseRequested: null,
			setTitle(title) {
				nativeWindow.title = String(title)
			},
			setSize(next) {
				nativeWindow.setContentSize(normalizeWindowSize(next, 'setSize'))
			},
			// Explicit close is a command; NSWindow.close() skips windowShouldClose,
			// which is reserved for user/performClose requests and their veto callback.
			close() {
				if (controller.isClosed) {
					return
				}

				closeOwnedWindows(nativeWindow)
				if (kind === 'dialog' && parentWindow) {
					parentWindow.endSheet(nativeWindow)
				} else {
					nativeWindow.close()
				}

				controller.__didClose()
			},
			__didClose() {
				if (controller.isClosed) {
					return
				}

				controller.isClosed = true
				try {
					closeOwnedWindows(nativeWindow)
				} catch (error) {
					console.error('[macos] failed to close owned windows while closing a window', error)
				}

				shared.byNative.delete(nativeWindow)
				shared.parentWindows.delete(nativeWindow)
				const root = controller.root
				controller.root = null
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
			shared.parentWindows.set(nativeWindow, parentWindow)
		}

		const component =
			options.component ?? (typeof shared.resolver === 'function'
				? shared.resolver(controller.data, controller)
				: null)
		if (typeof component !== 'function') {
			throw new Error(
				options.component == null
					? 'Install setWindowContentResolver() before calling openWindow()'
					: 'openWindow component must resolve to a component',
			)
		}

		controller.root = createMacOSRoot(nativeWindow.contentView)
		controller.root.render(component, options.props ?? { data: controller.data, controller })

		if (kind === 'dialog') {
			const beginSheet = parentWindow.beginSheetCompletionHandler ?? parentWindow.beginSheet
			beginSheet.call(parentWindow, nativeWindow, null)
		} else if (kind === 'popup') {
			parentWindow.addChildWindowOrdered(nativeWindow, NSWindowOrderingMode?.Above ?? 1)
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

/** Snapshot/press handles for every secondary window, used by dev automation. */
export function debugWindows() {
	return [...shared.byNative.entries()].map(([nativeWindow, controller]) => ({
		title: String(nativeWindow.title ?? ''),
		debug: controller.root?.__macosDebug ?? null,
	}))
}
