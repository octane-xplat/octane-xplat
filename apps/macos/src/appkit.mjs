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
		if (controller?.onCloseRequested?.() === false) return false
		return true
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
	shared.resolver = resolve
}

/**
 * Open a macOS window hosting its own Octane root. `kind` is a behavior
 * contract: 'regular' opens an independent window, 'dialog' presents as a
 * sheet on the parent (default: key window), 'popup' is a non-activating
 * child panel. Requested size and title are hints.
 */
export function openWindow(options = {}) {
	const kind = options.kind ?? 'regular'
	const parentOption = options.parent ?? null
	const parentWindow =
		(parentOption && 'window' in parentOption ? parentOption.window : parentOption) ??
		(kind === 'regular' ? null : app.keyWindow)
	const size =
		options.size ?? (kind === 'regular' ? { width: 480, height: 320 } : { width: 360, height: 200 })

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
			controller.root?.unmount()
			resolveWindowClosed()
		},
	}
	shared.byNative.set(window, controller)

	const component = shared.resolver?.(controller.data, controller)
	if (typeof component === 'function') {
		controller.root = createMacOSRoot(window.contentView)
		try {
			controller.root.render(component, { data: controller.data, controller })
		} catch (error) {
			console.error('[macos] window content render failed', error)
		}
	} else {
		console.warn('[macos] openWindow: content resolver returned no component')
	}

	if (kind === 'dialog' && parentWindow) {
		const beginSheet = parentWindow.beginSheetCompletionHandler ?? parentWindow.beginSheet
		beginSheet.call(parentWindow, window, null)
	} else if (kind === 'popup' && parentWindow) {
		parentWindow.addChildWindowOrdered(window, NSWindowOrderingMode?.Above ?? 1)
		window.orderFront(null)
	} else {
		window.center()
		window.makeKeyAndOrderFront(app)
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
