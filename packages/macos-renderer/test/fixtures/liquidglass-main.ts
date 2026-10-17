import '@nativescript/macos-node-api'
import { createMacOSRoot } from '@octane-xplat/macos-renderer'
import {
	NSApplication,
	NSApplicationActivationPolicy,
	NSWindow,
	NSWindowStyleMask,
} from '@octane-xplat/platform/macos'

import { checkLiquidGlassLifecycle } from './liquidglass-lifecycle'

const app = NSApplication.sharedApplication
app.setActivationPolicy(NSApplicationActivationPolicy.Regular)
const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
	{ origin: { x: 0, y: 0 }, size: { width: 400, height: 200 } },
	NSWindowStyleMask.Titled,
	2,
	false,
)

window.releasedWhenClosed = false
const root = createMacOSRoot(window.contentView)
window.makeKeyAndOrderFront(app)
app.finishLaunching()
setTimeout(async () => {
	try {
		await checkLiquidGlassLifecycle(root, window)
		console.log('PACKED_RENDERER_OK')
	} catch (error) {
		console.error(
			'PACKED_RENDERER_FAIL: ' + (error as Error).message + ' ' + (error as Error).stack,
		)
	} finally {
		root.unmount()
		window.orderOut(app)
		__xplatStopHost()
	}
}, 50)

if (process.env.OCTANE_MACOS_EXTERNAL_RUNLOOP !== '1') {
	app.run()
}
