import '../src/appkit.mjs'
import { announce } from '@octane-xplat/platform'

declare const NSApplication: any
declare const NSWindow: any
declare const NSAccessibilityPriorityLevel: any

const check = (value: boolean, message: string) => {
	if (!value) {
		throw new Error(message)
	}
}

setTimeout(() => {
	try {
		check(NSAccessibilityPriorityLevel.Medium === 50, 'Native medium priority is unavailable')
		const app = NSApplication.sharedApplication
		check(
			typeof (globalThis as any).__xplatAppKit?.announce === 'function',
			'Host did not install announce',
		)

		check(!app.keyWindow && !app.mainWindow, 'Fixture must begin without an active window')
		check(announce('Before any window') === undefined, 'announce must return void')
		announce('')
		announce(' \n\t')
		announce('Saved ✓')
		announce('Saved ✓')
		// Allocate an actual window without displaying it or making it key.
		const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
			{ origin: { x: 0, y: 0 }, size: { width: 100, height: 100 } },
			0,
			2,
			false,
		)

		window.releasedWhenClosed = false
		announce('Window allocated')
		window.close()
		announce('After window close')
		const shared = (globalThis as any).__xplatMacosWindowing
		check(shared.windowCloseHandlers.size === 0, 'announce installed a close handler')
		check(
			shared.platformServices.appStateListeners.size === 0,
			'announce installed a state listener',
		)

		// Exercise the same termination transition used by AppDelegate.
		shared.running = false
		announce('After host termination')
		console.log(
			'APPKIT_ANNOUNCE_OK: native posts before/after window close; blank/repeated calls; stopped host; no listeners',
		)
	} catch (error) {
		console.error('APPKIT_ANNOUNCE_FAIL: ' + (error as Error).message)
	} finally {
		;(globalThis as any).__xplatStopHost()
	}
}, 0)
