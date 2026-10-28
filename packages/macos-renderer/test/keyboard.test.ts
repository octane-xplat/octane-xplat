import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createAppKitKeyboardDispatcher } from '../src/keyboard.ts'

function fixture() {
	let monitor: (event: any) => any = (event) => event
	let registrations = 0
	const removed: unknown[] = []
	const native = { NSEvent: {
		addLocalMonitorForEventsMatchingMaskHandler: (_mask: number, callback: typeof monitor) => { monitor = callback; registrations++; return 'key-monitor' },
		removeMonitor: (token: unknown) => removed.push(token),
	} }
	const dispatcher = createAppKitKeyboardDispatcher(() => native)
	const window: any = { firstResponder: null }
	const parent: any = { window, superview: null }
	const field: any = { window, superview: parent }
	window.firstResponder = field
	const event = (overrides: Record<string, unknown> = {}) => ({
		type: 10, keyCode: 0, modifierFlags: 0, isARepeat: false, characters: 'a', charactersIgnoringModifiers: 'a', window, ...overrides,
	})
	return { dispatcher, native, field, parent, window, event, send: (event: any) => monitor(event), removed, registrations: () => registrations }
}

test('AppKit keys preserve logical characters, physical code, modifiers, repeat and key-up', () => {
	const env = fixture()
	const seen: any[] = []
	env.dispatcher.set(env.field, { onKeyDown: (event) => seen.push(event), onKeyUp: (event) => seen.push(event) })
	const down = env.event({ characters: '\u0001', charactersIgnoringModifiers: 'A', modifierFlags: (1 << 20) | (1 << 17), isARepeat: true })
	assert.equal(env.send(down), down)
	assert.equal(seen[0].key, 'A')
	assert.equal(seen[0].code, 'KeyA')
	assert.equal(seen[0].metaKey, true)
	assert.equal(seen[0].shiftKey, true)
	assert.equal(seen[0].repeat, true)
	const up = env.event({ type: 11, characters: 'q', charactersIgnoringModifiers: 'q' })
	env.send(up)
	assert.equal(seen[1].eventName, 'keyUp')
	assert.equal(seen[1].key, 'q')
	assert.equal(seen[1].code, 'KeyA') // Active text layout does not rewrite physical positions.
	env.dispatcher.dispose()
})

test('AppKit key cancellation bubbles and is dispatched once across monitors', () => {
	const env = fixture()
	const seen: string[] = []
	env.dispatcher.set(env.field, { onKeyDown: (event) => { seen.push('field'); event.preventDefault() } })
	env.dispatcher.set(env.parent, { onKeyDown: (event) => {
		seen.push('parent')
		assert.equal(event.defaultPrevented, true)
		assert.equal(event.target, env.field)
		assert.equal(event.currentTarget, env.parent)
	} })
	const event = env.event({ keyCode: 48, characters: '\t' })
	assert.equal(env.dispatcher.dispatch(event).defaultPrevented, true)
	assert.equal(env.send(event), null)
	assert.deepEqual(seen, ['field', 'parent'])
	assert.equal(env.registrations(), 1)
	env.dispatcher.dispose()
})

test('stopping Xplat propagation preserves the native default unless prevented', () => {
	const env = fixture()
	let parentCalls = 0
	env.dispatcher.set(env.field, { onKeyDown: (event) => event.stopPropagation() })
	env.dispatcher.set(env.parent, { onKeyDown: () => parentCalls++ })
	const event = env.event()
	assert.equal(env.send(event), event)
	assert.equal(parentCalls, 0)
	assert.equal(env.dispatcher.dispatch(event).propagationStopped, true)
	env.dispatcher.dispose()
})

test('field editors route to owning controls and marked text/dead keys are reported', () => {
	const env = fixture()
	const seen: any[] = []
	const editor = { window: env.window, delegate: env.field, hasMarkedText: true }
	env.field.currentEditor = () => editor
	env.window.firstResponder = editor
	env.dispatcher.set(env.field, { onKeyDown: (event) => seen.push(event) })
	const composing = env.event({ keyCode: 36, characters: '\r' })
	assert.equal(env.send(composing), composing)
	assert.equal(seen[0].key, 'Enter')
	assert.equal(seen[0].isComposing, true)
	assert.equal(seen[0].target, env.field)
	editor.hasMarkedText = false
	env.send(env.event({ keyCode: 50, characters: '', charactersIgnoringModifiers: '`', modifierFlags: 1 << 19 }))
	assert.equal(seen[1].key, 'Dead')
	assert.equal(seen[1].isComposing, true)
	env.dispatcher.dispose()
})

test('navigation/function keys normalize and unknown physical codes remain empty', () => {
	const env = fixture()
	const seen: any[] = []
	env.dispatcher.set(env.field, { onKeyDown: (event) => seen.push(event) })
	env.send(env.event({ keyCode: 123, characters: '\uf702' }))
	env.send(env.event({ keyCode: 105, characters: '\uf710' }))
	env.send(env.event({ keyCode: 999, characters: 'λ' }))
	assert.deepEqual(seen.map(({ key, code }) => [key, code]), [['ArrowLeft', 'ArrowLeft'], ['F13', 'F13'], ['λ', '']])
	env.dispatcher.dispose()
})

test('bindings update/remove and ignore unrelated windows and non-key events', () => {
	const env = fixture()
	let calls = 0
	env.dispatcher.set(env.field, { onKeyDown: () => calls++ })
	env.dispatcher.set(env.field, { onKeyDown: () => calls += 10 })
	env.send(env.event())
	assert.equal(calls, 10)
	const other = env.event({ window: { firstResponder: env.field } })
	assert.equal(env.send(other), other)
	const flags = env.event({ type: 12 })
	assert.equal(env.send(flags), flags)
	assert.equal(calls, 10)
	env.dispatcher.set(env.field)
	assert.deepEqual(env.removed, ['key-monitor'])
	env.send(env.event())
	assert.equal(calls, 10)
})

test('missing and failed monitoring report unavailable', () => {
	assert.equal(createAppKitKeyboardDispatcher(() => ({})).available(), false)
	const env = fixture()
	env.native.NSEvent.addLocalMonitorForEventsMatchingMaskHandler = () => { throw new Error('unavailable') }
	env.dispatcher.set(env.field, { onKeyDown: () => {} })
	assert.equal(env.dispatcher.available(), false)
	env.dispatcher.dispose()
})

test('modality observers run before cancellation and keep observation until released', () => {
	const env = fixture()
	const order: string[] = []
	const off = env.dispatcher.observe(() => order.push('observed'))
	env.dispatcher.set(env.field, { onKeyDown: (event) => { order.push('handled'); event.preventDefault() } })
	const event = env.event()
	assert.equal(env.send(event), null)
	env.dispatcher.dispatch(event)
	assert.deepEqual(order, ['observed', 'handled'])
	env.dispatcher.set(env.field)
	assert.deepEqual(env.removed, [])
	off()
	assert.deepEqual(env.removed, ['key-monitor'])
})
