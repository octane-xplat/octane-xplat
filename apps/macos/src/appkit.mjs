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
})

shared.windowCloseHandlers ??= new Map()
shared.parentWindows ??= new Map()
shared.running ??= true
shared.eventPumpErrorReported ??= false
shared.applicationClosed ??= new Promise((resolve) => {
	shared.resolveApplicationClosed = resolve
})

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
		return true
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

export function createAppKitWindow() {
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
	app.delegate = shared.appDelegate

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

		if (typeof shared.resolver !== 'function') {
			throw new Error('Install setWindowContentResolver() before calling openWindow()')
		}

		const component = shared.resolver(controller.data, controller)
		if (typeof component !== 'function') {
			throw new Error('The window content resolver did not return a component')
		}

		controller.root = createMacOSRoot(nativeWindow.contentView)
		controller.root.render(component, { data: controller.data, controller })

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
