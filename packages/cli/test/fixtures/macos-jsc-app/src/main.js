import '@nativescript/macos-node-api'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const app = NSApplication.sharedApplication
app.setActivationPolicy(NSApplicationActivationPolicy.Regular)
const style = NSWindowStyleMask.Titled | NSWindowStyleMask.Closable
const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
	{ origin: { x: 0, y: 0 }, size: { width: 360, height: 220 } }, style, 2, false,
)
window.title = 'JSC fixture'
window.releasedWhenClosed = false
window.makeKeyAndOrderFront(app)
app.finishLaunching()
setTimeout(() => {
	const manifest = readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')
	const passed = window.title === 'JSC fixture' && manifest.includes('xplat-macos-jsc-fixture')
	console.log(passed ? 'JSC_FIXTURE_OK' : 'JSC_FIXTURE_FAIL')
	window.close()
	app.terminate(null)
}, 100)
