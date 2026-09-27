import '@nativescript/macos-node-api'

const app = NSApplication.sharedApplication
let detailsWindow
let detailsLabel
let resolveClosed
const closed = new Promise((resolve) => {
	resolveClosed = resolve
})

let running = true

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

	windowWillClose() {
		app.terminate(this)
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

		if (event !== null) {app.sendEvent(event)}
		if (running) {setTimeout(() => this.pumpEvents(), 10)}
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

	return { app, window, contentView, closed, delegate }
}

export function showDetailsWindow(count) {
	if (!detailsWindow) {
		detailsWindow = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
			{ origin: { x: 0, y: 0 }, size: { width: 360, height: 180 } },
			NSWindowStyleMask.Titled | NSWindowStyleMask.Closable | NSWindowStyleMask.Miniaturizable,
			2,
			false,
		)

		detailsWindow.title = 'Octane Details'
		detailsWindow.releasedWhenClosed = false
		detailsWindow.center()

		const contentView = NSView.alloc().initWithFrame({
			origin: { x: 0, y: 0 },
			size: { width: 360, height: 180 },
		})

		detailsLabel = NSTextField.alloc().initWithFrame({
			origin: { x: 0, y: 0 },
			size: { width: 300, height: 40 },
		})

		detailsLabel.bezeled = false
		detailsLabel.drawsBackground = false
		detailsLabel.editable = false
		detailsLabel.selectable = false
		detailsLabel.alignment = NSTextAlignment.Center
		detailsLabel.translatesAutoresizingMaskIntoConstraints = false
		contentView.addSubview(detailsLabel)
		detailsLabel.centerXAnchor.constraintEqualToAnchor(contentView.centerXAnchor).active = true
		detailsLabel.centerYAnchor.constraintEqualToAnchor(contentView.centerYAnchor).active = true
		detailsWindow.contentView = contentView
	}

	detailsLabel.stringValue = 'Count when opened: ' + count
	detailsWindow.makeKeyAndOrderFront(app)
	app.activateIgnoringOtherApps(true)
}
