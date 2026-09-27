import '@nativescript/macos-node-api'
import { createMacOSRoot } from '@xplat/macos/renderer'

const app = NSApplication.sharedApplication
let running = true
let resolveClosed
const closed = new Promise((resolve) => {
	resolveClosed = resolve
})

// The dev harness and the bundled app import this module as separate
// instances; windowing state is shared through globalThis so delegates
// registered by one copy see windows created by the other.
const shared = (globalThis.__xplatMacosWindowing ??= {
	resolver: null,
	appDelegate: null,
	byNative: new Map(),
})

function controllerFor(window) {
	const direct = shared.byNative.get(window)
	if (direct) return direct
	for (const [native, controller] of shared.byNative) {
		if (native.isEqual?.(window)) return controller
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

	windowShouldClose(window) {
		const controller = controllerFor(window)
		try {
			return controller?.onCloseRequested?.() !== false
		} catch (error) {
			console.error('[macos] window close request handler failed', error)
			return false
		}
	}

	// A regular secondary window may outlive the main window. AppKit's
	// last-window policy handles application termination.
	windowWillClose(notification) {
		const window = notification.object
		const controller = controllerFor(window)
		if (controller) controller.__didClose()
	}

	applicationWillTerminate() {
		running = false
		resolveClosed()
	}

	pumpEvents() {
		const event = app.nextEventMatchingMaskUntilDateInModeDequeue(
			NSEventMask.Any,
			null,
			'kCFRunLoopDefaultMode',
			true,
		)
		if (event !== null) app.sendEvent(event)
		if (running) setTimeout(() => this.pumpEvents(), 10)
	}
}

function appDelegate() {
	if (!shared.appDelegate) shared.appDelegate = AppDelegate.new()
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

function normalizeWindowSize(size) {
	if (
		!size ||
		typeof size !== 'object' ||
		!Number.isFinite(size.width) ||
		!Number.isFinite(size.height) ||
		size.width <= 0 ||
		size.height <= 0
	) {
		throw new TypeError('openWindow size must have positive finite width and height')
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

	const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
		{ origin: { x: 0, y: 0 }, size: { width: 640, height: 420 } },
		REGULAR_STYLE,
		2,
		false,
	)
	window.title = 'Octane macOS spike'
	window.releasedWhenClosed = false
	window.center()
	window.delegate = appDelegate()
	app.delegate = shared.appDelegate

	const contentView = makeContentView({ width: 640, height: 420 })
	window.contentView = contentView
	window.makeKeyAndOrderFront(app)

	return { app, window, contentView, closed, delegate: shared.appDelegate }
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

	const window = (kind === 'popup' ? NSPanel : NSWindow)
		.alloc()
		.initWithContentRectStyleMaskBackingDefer(
			{ origin: { x: 0, y: 0 }, size },
			styleMask,
			2,
			false,
		)
	window.title = String(options.title ?? 'Octane window')
	window.releasedWhenClosed = false
	window.delegate = appDelegate()
	window.contentView = makeContentView(size)

	let resolveWindowClosed
	const controller = {
		kind,
		window,
		data: options.data ?? null,
		root: null,
		isClosed: false,
		closed: new Promise((resolve) => {
			resolveWindowClosed = resolve
		}),
		onCloseRequested: null,
		setTitle(title) {
			window.title = String(title)
		},
		setSize(next) {
			window.setContentSize(next)
		},
		close() {
			if (kind === 'dialog' && parentWindow) parentWindow.endSheet(window)
			else window.close()
			controller.__didClose()
		},
		__didClose() {
			if (controller.isClosed) return
			controller.isClosed = true
			shared.byNative.delete(window)
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
	shared.byNative.set(window, controller)

	try {
		if (typeof shared.resolver !== 'function') {
			throw new Error('Install setWindowContentResolver() before calling openWindow()')
		}

		const component = shared.resolver(controller.data, controller)
		if (typeof component !== 'function') {
			throw new Error('The window content resolver did not return a component')
		}

		controller.root = createMacOSRoot(window.contentView)
		controller.root.render(component, { data: controller.data, controller })

		if (kind === 'dialog') {
			const beginSheet = parentWindow.beginSheetCompletionHandler ?? parentWindow.beginSheet
			beginSheet.call(parentWindow, window, null)
		} else if (kind === 'popup') {
			parentWindow.addChildWindowOrdered(window, NSWindowOrderingMode?.Above ?? 1)
			window.orderFront(null)
		} else {
			window.center()
			window.makeKeyAndOrderFront(app)
		}
	} catch (error) {
		controller.__didClose()
		try {
			window.close()
		} catch (closeError) {
			console.error('[macos] failed to close a window after setup failed', closeError)
		}
		throw error
	}
	return controller
}

/** Snapshot/press handles for every secondary window, used by dev automation. */
export function debugWindows() {
	return [...shared.byNative.entries()].map(([window, controller]) => ({
		title: String(window.title ?? ''),
		debug: controller.root?.__macosDebug ?? null,
	}))
}
