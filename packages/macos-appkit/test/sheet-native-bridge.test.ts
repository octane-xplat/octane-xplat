import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createNativeSheet } from '../src/sheet.macos.ts'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'

// Execute the actual renderer factory/classes against fakes, not native AppKit.
const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
function fixture() {
	const registrations: any[] = [], tokens = new Set<any>(), children: any[] = []
	let dismissed = 0, completion = () => {}, superclassCalls = 0
	class View {
		window: any = null
		static alloc() { return new this() }
		initWithFrame(_frame: any) { return this }
		viewDidMoveToWindow() { superclassCalls++ }
		removeFromSuperview() { this.window = null; this.viewDidMoveToWindow() }
	}
	class Window {
		static alloc() { return new this() }
		initWithContentRectStyleMaskBackingDefer() { return this }
		orderOut() {}
		close() {}
	}
	const api = runSlice(source.slice(source.indexOf('const sheetWindowCancels ='), source.indexOf('\nconst appKitBridge =')) + '\n({presentSheet,AppKitSheetWindow,AppKitSheetAnchorObserver})', {
		NSView: View, NSWindow: Window, NSObject: class {},
		NSViewController: { alloc: () => ({ init: () => ({}) }) },
		NSWindowStyleMask: { Titled: 1, Closable: 2 }, NSBackingStoreType: { Buffered: 2 },
		interop: { types: { void: 'void' } }, registerGestureClass: (cls: any) => registrations.push(cls),
		createNativeSheet, popupFittingSize: () => ({ width: 400, height: 200 }),
		NSNotificationCenter: { defaultCenter: {
			addObserverForNameObjectQueueUsingBlock(name: string, window: any, _queue: any, notify: any) { const token = { name, window, notify }; tokens.add(token); return token },
			removeObserver: (token: any) => tokens.delete(token),
		} },
	})
	const parent: any = {
		beginSheetCompletionHandler(sheet: any, callback: () => void) { parent.sheet = sheet; completion = callback },
		endSheet: () => completion(),
	}
	const anchor: any = { window: null, addSubview(child: any) { children.push(child); child.window = anchor.window; child.viewDidMoveToWindow() } }
	const handle = api.presentSheet(anchor, { onDismissed: () => dismissed++ })
	return { api, registrations, tokens, parent, anchor, children, handle,
		move(window: any) { anchor.window = window; for (const child of children) { child.window = window; child.viewDidMoveToWindow() } },
		dismissed: () => dismissed, superclassCalls: () => superclassCalls }
}
test('native factory waits for its hidden anchor observer and unregisters every callback on close', () => {
	const f = fixture(); assert.equal(f.children[0].hidden, true); f.handle.present()
	assert.equal(f.parent.sheet, undefined); f.move(f.parent); assert.ok(f.parent.sheet)
	assert.equal(f.tokens.size, 2); const sheet = f.parent.sheet
	f.handle.close(); assert.equal(f.tokens.size, 0); sheet.cancelOperation(null); f.move(null)
	assert.equal(f.dismissed(), 0); assert.ok(f.superclassCalls() >= 3)
})
test('sheet cancellation and window move expose exact selectors and use native registration', () => {
	const f = fixture(), { AppKitSheetWindow, AppKitSheetAnchorObserver } = f.api
	assert.deepEqual(f.registrations, [AppKitSheetWindow, AppKitSheetAnchorObserver])
	assert.equal(AppKitSheetWindow.ObjCExposedMethods['cancelOperation:'].params.length, 1)
	assert.equal(AppKitSheetWindow.ObjCExposedMethods.cancelOperation, undefined)
	assert.equal(AppKitSheetAnchorObserver.ObjCExposedMethods.viewDidMoveToWindow.params.length, 0)
	f.move(f.parent); f.handle.present(); f.parent.sheet.cancelOperation(null); f.parent.sheet.cancelOperation(null)
	assert.equal(f.dismissed(), 1); assert.equal(f.tokens.size, 0)
})
