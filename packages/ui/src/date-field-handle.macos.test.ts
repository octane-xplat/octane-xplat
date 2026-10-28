import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { createAppKitDateFieldHandle } from './date-field-handle.macos.ts'

function fixture() {
	const requests: unknown[] = []
	const window = { firstResponder: null as any, makeFirstResponder(view: any) { requests.push(view); this.firstResponder = view; return true } }
	const view: any = { window, hidden: false, enabled: true, isAccessibilityEnabled: () => true }
	let primary: any = view, blocked = false
	const handle = createAppKitDateFieldHandle({ primary: () => primary, blocked: () => blocked })
	return { window, view, requests, handle, target: (next: any) => { primary = next }, block: (next: boolean) => { blocked = next } }
}
test('date-field handles resolve live primary hosts and reject blocked, hidden, disabled and detached focus', () => {
	const env = fixture(), { handle, view, window } = env
	assert.equal(handle.native, view); handle.focus(); assert.deepEqual(env.requests, [view])
	env.requests.length = 0
	env.block(true); handle.focus(); env.block(false)
	for (const [key, value] of [['hidden', true], ['hiddenOrHasHiddenAncestor', () => true], ['enabled', false], ['isEnabled', () => false], ['isEnabled', 0], ['isAccessibilityEnabled', () => false]] as const) {
		const previous = view[key]; view[key] = value; handle.focus(); view[key] = previous
	}
	view.window = null; handle.focus(); assert.equal(env.requests.length, 0)
	const replacement: any = { window }; env.target(replacement); handle.focus()
	assert.equal(handle.native, replacement); assert.deepEqual(env.requests, [replacement])
	env.target(null); handle.focus(); handle.blur(); assert.equal(handle.native, null); assert.equal(env.requests.length, 1)
})
test('blur releases only a current owned view or its field editor, accepting editor methods and properties', () => {
	const env = fixture(), editor = {}, other = {}
	env.window.firstResponder = other; env.view.currentEditor = () => editor; env.handle.blur(); assert.equal(env.requests.length, 0)
	env.window.firstResponder = editor; env.handle.blur(); assert.deepEqual(env.requests, [null])
	env.view.currentEditor = editor; env.window.firstResponder = editor; env.handle.blur(); assert.equal(env.requests.length, 2)
	env.block(true); env.window.firstResponder = env.view; env.handle.blur(); assert.equal(env.requests.length, 3) // Disabling cannot strand an owned responder.
	env.view.window = null; env.window.firstResponder = editor; env.handle.blur(); assert.equal(env.requests.length, 3)
})
test('composite handles focus the primary field and blur only a live owned secondary responder in its own window', () => {
	const first = fixture(), second = fixture(), editor = {}
	const handle = createAppKitDateFieldHandle({ primary: () => first.view, fields: () => [first.view, second.view], blocked: () => false })
	handle.focus(); assert.deepEqual(first.requests, [first.view]); assert.equal(second.requests.length, 0)
	first.window.firstResponder = {}; second.window.firstResponder = editor; second.view.currentEditor = () => editor
	handle.blur(); assert.deepEqual(second.requests, [null]); assert.equal(first.requests.length, 1)
	second.view.window = null; second.window.firstResponder = editor; handle.blur(); assert.equal(second.requests.length, 1)
})
