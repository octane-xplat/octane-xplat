import '@nativescript/macos-node-api'

const app = NSApplication.sharedApplication
let resolveClosed
const closed = new Promise((resolve) => {
	resolveClosed = resolve
})

class AppDelegate extends NSObject {
	static ObjCProtocols = [NSApplicationDelegate, NSWindowDelegate]

	static {
		NativeClass(this)
	}

	running = true

	applicationDidFinishLaunching() {
		app.activateIgnoringOtherApps(true)
		app.stop(this)
		setTimeout(() => this.pumpEvents(), 0)
	}

	applicationShouldTerminateAfterLastWindowClosed() {
		return true
	}

	windowWillClose() {
		app.terminate(this)
	}

	applicationWillTerminate() {
		this.running = false
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
		if (this.running) setTimeout(() => this.pumpEvents(), 10)
	}
}

export function createAppKitWindow() {
	app.setActivationPolicy(NSApplicationActivationPolicy.Regular)

	const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
		{ origin: { x: 0, y: 0 }, size: { width: 640, height: 420 } },
		NSWindowStyleMask.Titled |
			NSWindowStyleMask.Closable |
			NSWindowStyleMask.Miniaturizable |
			NSWindowStyleMask.Resizable,
		2,
		false,
	)
	window.title = 'Octane macOS spike'
	window.releasedWhenClosed = false
	window.center()
	const delegate = AppDelegate.new()
	window.delegate = delegate
	app.delegate = delegate

	const contentView = NSView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 640, height: 420 },
	})
	window.contentView = contentView
	window.makeKeyAndOrderFront(app)

	return { app, window, contentView, closed }
}
