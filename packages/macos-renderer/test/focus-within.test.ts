import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createAppKitFocusWithinDispatcher } from '../src/focus-within.ts'

function fixture() {
	let notify: (notification: any) => void = () => {}
	let registrations = 0
	const removed: unknown[] = []
	const center = {
		addObserverForNameObjectQueueUsingBlock: (_name: string, _object: unknown, _queue: unknown, callback: typeof notify) => {
			notify = callback; registrations++; return 'focus-monitor'
		},
		removeObserver: (token: unknown) => removed.push(token),
	}
	const dispatcher = createAppKitFocusWithinDispatcher(() => ({ NSNotificationCenter: { defaultCenter: center } }))
	const window: any = { firstResponder: null }
	const root: any = { window, superview: null }
	const first: any = { window, superview: root }
	const second: any = { window, superview: root }
	const outside: any = { window, superview: null }
	const focus = (view: any) => { window.firstResponder = view; notify({ object: window }) }
	return { dispatcher, window, root, first, second, outside, focus, removed, registrations: () => registrations }
}

test('container callbacks report boundary crossings, not movement among descendants', () => {
	const env = fixture()
	const events: any[] = []
	env.window.firstResponder = env.outside
	env.dispatcher.set(env.root, { onFocus: (event) => events.push(event), onBlur: (event) => events.push(event) })
	env.focus(env.outside)
	env.focus(env.first)
	env.focus(env.second)
	assert.equal(events.length, 1)
	assert.equal(events[0].target, env.first)
	assert.equal(events[0].currentTarget, env.root)
	assert.equal(events[0].relatedTarget, env.outside)
	env.focus(env.outside)
	assert.equal(events.length, 2)
	assert.equal(events[1].type, 'blur')
	assert.equal(events[1].target, env.second)
	assert.equal(events[1].relatedTarget, env.outside)
	env.dispatcher.dispose()
	assert.deepEqual(env.removed, ['focus-monitor'])
})

test('shared field editor resolves to its owning control before native ancestry', () => {
	const env = fixture()
	const editor = { window: env.window, delegate: env.first, superview: null }
	env.first.currentEditor = () => editor
	const events: any[] = []
	env.dispatcher.set(env.root, { onFocus: (event) => events.push(event) })
	env.focus(editor)
	assert.equal(events[0].target, env.first)
	env.first.currentEditor = () => null
	env.focus(editor)
	env.focus(env.first)
	assert.equal(events.length, 2)
	env.dispatcher.dispose()
})

test('replacements retain state; removals release the observer and pending initial sync', async () => {
	const env = fixture()
	const calls: string[] = []
	env.window.firstResponder = env.first
	env.dispatcher.set(env.root, { onFocus: () => calls.push('old') })
	env.dispatcher.set(env.root, { onFocus: () => calls.push('new'), onBlur: () => calls.push('blur') })
	assert.deepEqual(calls, [])
	await Promise.resolve()
	assert.deepEqual(calls, ['new'])
	assert.equal(env.registrations(), 1)
	env.focus(env.second)
	env.focus(null)
	assert.deepEqual(calls, ['new', 'blur'])
	env.dispatcher.set(env.root)
	env.dispatcher.set(env.root, { onFocus: () => calls.push('removed') })
	env.dispatcher.set(env.root)
	await Promise.resolve()
	assert.deepEqual(calls, ['new', 'blur'])
	assert.equal(env.removed.length, 2)
})

test('windows and nested boundaries keep independent containment state', () => {
	const env = fixture()
	const secondWindow: any = { firstResponder: null }
	const other: any = { window: secondWindow, superview: null }
	secondWindow.firstResponder = other
	const calls: string[] = []
	env.dispatcher.set(env.root, { onFocus: () => calls.push('root') })
	env.dispatcher.set(env.first, { onFocus: () => calls.push('child'), onBlur: () => calls.push('child-blur') })
	env.dispatcher.set(other, { onFocus: () => calls.push('other') })
	env.focus(env.first)
	env.dispatcher.synchronize(secondWindow)
	env.focus(env.second)
	assert.deepEqual(calls, ['root', 'child', 'other', 'child-blur'])
	env.dispatcher.dispose()
})

test('detachment emits an exit and reparenting permits a later entry', () => {
	const env = fixture()
	const calls: string[] = []
	env.dispatcher.set(env.root, { onFocus: () => calls.push('in'), onBlur: () => calls.push('out') })
	env.focus(env.first)
	env.root.window = null
	env.dispatcher.synchronize(env.window)
	assert.deepEqual(calls, ['in', 'out'])
	env.root.window = env.window
	env.dispatcher.synchronize(env.window)
	assert.deepEqual(calls, ['in', 'out', 'in'])
	env.dispatcher.dispose()
})

test('unavailable or failed native observation is reported without throwing', () => {
	const missing = createAppKitFocusWithinDispatcher(() => ({}))
	assert.equal(missing.available(), false)
	missing.set({}, { onFocus() { throw new Error('must not fire') } })
	missing.dispose()
	const failed = createAppKitFocusWithinDispatcher(() => ({ NSNotificationCenter: { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock() { throw new Error('bridge unavailable') }, removeObserver() {},
	} } }))
	failed.set({}, { onFocus() {} })
	assert.equal(failed.available(), false)
	failed.dispose()
})
