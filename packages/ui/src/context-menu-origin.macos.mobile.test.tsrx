import { expect, it } from 'vitest'
import { appKitContextMenuOrigin, appKitContextPointerOrigin } from './context-menu-origin.macos'

function fixture() {
	const window: any = {}, root: any = { window, superview: null }, shell: any = { window, superview: root }
	const view: any = { window, superview: shell }
	return { window, root, shell, view }
}

it('context origins must remain descendants in the current wrapper window', () => {
	const f = fixture()
	expect(appKitContextMenuOrigin(f.root, f.view)).toBe(f.view)
	f.view.superview = null; expect(appKitContextMenuOrigin(f.root, f.view)).toBeNull()
	f.view.superview = f.shell; f.view.window = {}; expect(appKitContextMenuOrigin(f.root, f.view)).toBeNull()
})

it('missing or detached context hosts cannot claim an origin', () => {
	const f = fixture()
	expect(appKitContextMenuOrigin(null, f.view)).toBeNull()
	expect(appKitContextMenuOrigin(f.root, null)).toBeNull()
	f.root.window = null; expect(appKitContextMenuOrigin(f.root, f.view)).toBeNull()
})

it('hidden/blocked origins are excluded while explicitly focusable disabled hosts remain usable', () => {
	const f = fixture()
	for (const patch of [{ hidden: true }, { hiddenOrHasHiddenAncestor: () => true }, { enabled: false }, { isEnabled: () => false }, { isAccessibilityEnabled: () => false }]) {
		Object.assign(f.view, patch); expect(appKitContextMenuOrigin(f.root, f.view)).toBeNull()
		for (const key of Object.keys(patch)) delete f.view[key]
	}
	f.view.isAccessibilityEnabled = () => false; f.view.canBecomeKeyView = () => true
	expect(appKitContextMenuOrigin(f.root, f.view)).toBe(f.view)
})


it('pointer hits choose an eligible focusable ancestor rather than decorative text, while foreign hits have no origin', () => {
	const f = fixture()
	f.shell.acceptsFirstResponder = () => true
	expect(appKitContextPointerOrigin(f.root, f.view)).toBe(f.shell)
	f.view.acceptsFirstResponder = true; expect(appKitContextPointerOrigin(f.root, f.view)).toBe(f.view)
	f.view.isEnabled = false; expect(appKitContextPointerOrigin(f.root, f.view)).toBe(f.shell)
	f.view.window = {}; expect(appKitContextPointerOrigin(f.root, f.view)).toBeNull()
})
