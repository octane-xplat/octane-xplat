import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { createAppKitMenuFocus } from './menu-focus.macos.ts'

function fixture(initial: 'first' | 'last' | 'container' = 'first') {
	const calls: any[] = [], state = { supported: true, allow: true, resetCount: 0, disposed: 0, synchronized: 0, onFocus: () => {}, onDispose: () => {} }
	const window: any = { firstResponder: null, makeFirstResponder(view: any) { calls.push(view); if (!state.allow || view.window !== this) return false; this.firstResponder = view; state.onFocus(); return true } }
	const root: any = { window, hidden: false }, views = new Map<string, any>()
	for (const key of ['a', 'b', 'c']) views.set(key, { window, key })
	let current: any = root
	const eligible = () => [...views].filter(([, view]) => !view.disabled && !view.hidden).map(([key]) => key)
	const focus = createAppKitMenuFocus({ root: () => current, views, eligible, initial: () => initial,
		supported: () => state.supported, resetKeyboard: () => { state.resetCount++ },
		navigation: { dispose: () => { state.disposed++; state.onDispose() }, synchronize() { state.synchronized++ }, focus: (key) => views.has(key) && current?.window?.makeFirstResponder(views.get(key)) },
	})
	const remove = (key: string) => { const view = views.get(key); focus.removed(key, view); views.delete(key); return view }
	return { root, window, views, focus, state, calls, remove, detach: () => { current = null; focus.reset() } }
}
test('initial edges/container and observed removal repair preserve position without activating rows', () => {
	for (const initial of ['first', 'last', 'container'] as const) {
		const f = fixture(initial); f.focus.refresh()
		assert.equal(f.window.firstResponder, initial === 'container' ? f.root : f.views.get(initial === 'first' ? 'a' : 'c'))
	}
	const f = fixture(); f.focus.refresh(); f.focus.focus('b'); f.remove('b'); f.focus.refresh()
	assert.equal(f.window.firstResponder, f.views.get('c'))
	f.window.firstResponder = null; f.remove('c'); f.focus.refresh(); assert.equal(f.window.firstResponder, f.views.get('a'))
	f.remove('a'); f.focus.refresh(); assert.equal(f.window.firstResponder, f.root)
})
test('current disabled/hidden rows repair to an enabled neighbor; unrelated item changes do not reset focus', () => {
	const f = fixture(); f.focus.refresh(); f.focus.focus('b'); f.views.get('b').disabled = true; f.focus.refresh()
	assert.equal(f.window.firstResponder, f.views.get('c'))
	f.views.get('a').hidden = true; const before = f.calls.length; f.focus.refresh(); assert.equal(f.calls.length, before)
	f.views.get('c').disabled = true; f.focus.refresh(); assert.equal(f.window.firstResponder, f.root)
	f.remove('c'); f.views.get('a').hidden = false; f.focus.refresh(); assert.equal(f.window.firstResponder, f.root)
})
test('captured removal permits native null/container/window fallback but preserves nested, other-menu and field-editor responders', () => {
	for (const fallback of ['null', 'container', 'window'] as const) {
		const f = fixture(); f.focus.refresh(); f.focus.focus('b')
		f.window.firstResponder = fallback === 'null' ? null : fallback === 'container' ? f.root : f.window
		f.remove('b'); f.focus.refresh(); assert.equal(f.window.firstResponder, f.views.get('c'))
	}
	for (const external of [{ editor: true }, { anotherMenu: true }, { nestedInput: true }]) {
		const f = fixture(); f.focus.refresh(); f.focus.focus('b'); f.remove('b'); f.window.firstResponder = external
		const before = f.calls.length; f.focus.refresh(); assert.equal(f.window.firstResponder, external); assert.equal(f.calls.length, before)
		f.window.firstResponder = null; f.focus.refresh(); assert.equal(f.calls.length, before) // Cancelled repair cannot later steal focus.
	}
})
test('scope hide/detach/window changes and unsupported bridges discard old ownership; failed native focus can retry', () => {
	const f = fixture(); f.focus.refresh(); f.focus.focus('b'); f.remove('b'); f.root.hidden = true
	const before = f.calls.length; f.focus.refresh(); assert.equal(f.calls.length, before)
	f.root.hidden = false; f.window.firstResponder = {}; f.focus.refresh(); assert.equal(f.calls.length, before)
	f.root.window = null; f.focus.refresh(); assert.equal(f.focus.observes(f.window), false)
	f.state.supported = false; f.root.window = f.window; f.focus.refresh(); assert.equal(f.calls.length, before)
	f.state.supported = true; f.state.allow = false; f.focus.refresh(); assert.equal(f.window.firstResponder === f.views.get('a'), false)
	f.state.allow = true; f.focus.refresh(); assert.equal(f.window.firstResponder, f.views.get('a'))
	f.detach(); f.focus.refresh(); assert.equal(f.focus.focus('c'), false)
	const moved = fixture(); moved.focus.refresh(); moved.focus.focus('b'); moved.remove('b')
	const otherWindow: any = { firstResponder: null, makeFirstResponder: moved.window.makeFirstResponder }
	moved.root.window = otherWindow; for (const view of moved.views.values()) view.window = otherWindow
	moved.focus.refresh(); assert.equal(otherWindow.firstResponder, moved.views.get('a'))
	assert.equal(moved.focus.observes(moved.window), false); assert.equal(moved.focus.observes(otherWindow), true)
})
test('native notification recursion and synchronous teardown cannot resurrect stale initial or repair focus', () => {
	const f = fixture(); f.state.onFocus = () => f.focus.refresh(); f.focus.refresh(); assert.equal(f.calls.length, 1)
	f.state.onDispose = () => f.focus.refresh(); const synchronized = f.state.synchronized; f.focus.reset(); assert.equal(f.state.synchronized, synchronized)
	f.state.onDispose = () => {}; f.focus.refresh()
	f.focus.focus('b'); f.remove('b'); f.state.onFocus = f.detach; f.focus.refresh()
	const before = f.calls.length; f.focus.refresh(); assert.equal(f.calls.length, before)
	const initial = fixture(); initial.state.onFocus = initial.detach; initial.focus.refresh()
	assert.equal(initial.focus.focus('a'), false)
})
