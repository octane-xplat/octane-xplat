import '@nativescript/macos-node-api'

// Minimal AppKit window harness for the CEF spike — a trimmed copy of
// apps/macos/src/appkit.mjs carrying only what a single regular window needs:
// finishLaunching, a setTimeout-driven event pump, and close bookkeeping.

const app = NSApplication.sharedApplication

const shared = (globalThis.__xplatCefWindowing ??= {
	running: true,
	appDelegate: null,
	windowCloseHandlers: new Map(),
})

shared.applicationClosed ??= new Promise((resolve) => {
	shared.resolveApplicationClosed = resolve
})

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

	windowShouldClose() {
		return true
	}

	windowWillClose(notification) {
		shared.windowCloseHandlers.get(notification.object)?.()
		shared.windowCloseHandlers.delete(notification.object)
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
		} catch (error) {
			console.error('[cef-spike] AppKit event pump failed; retrying', error)
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

function makeContentView(size) {
	return NSView.alloc().initWithFrame({ origin: { x: 0, y: 0 }, size })
}

const REGULAR_STYLE =
	NSWindowStyleMask.Titled |
	NSWindowStyleMask.Closable |
	NSWindowStyleMask.Miniaturizable |
	NSWindowStyleMask.Resizable

export function createAppKitWindow({ title = 'Xplat CEF spike', width = 1024, height = 768 } = {}) {
	app.setActivationPolicy(NSApplicationActivationPolicy.Regular)

	const nativeWindow = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
		{ origin: { x: 0, y: 0 }, size: { width, height } },
		REGULAR_STYLE,
		2,
		false,
	)

	nativeWindow.title = title
	nativeWindow.releasedWhenClosed = false
	nativeWindow.center()
	nativeWindow.delegate = appDelegate()
	app.delegate = shared.appDelegate

	const contentView = makeContentView({ width, height })
	contentView.widthAnchor.constraintEqualToConstant(width).active = true
	contentView.heightAnchor.constraintEqualToConstant(height).active = true
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
		applicationClosed: shared.applicationClosed,
		windowClosed,
		delegate: shared.appDelegate,
	}
}
