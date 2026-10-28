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

test('owned subscriptions compose with prop handlers and keep one monitor until the last owner releases', () => {
	const f = fixture(), seen: string[] = []
	f.dispatcher.set(f.field, { onKeyDown: () => seen.push('prop') })
	const off = f.dispatcher.subscribe(f.field, { onKeyDown: () => seen.push('owned'), onKeyUp: () => seen.push('up') })
	assert.equal(f.registrations(), 1)
	f.send(f.event()); assert.deepEqual(seen, ['prop', 'owned'])
	f.dispatcher.set(f.field, { onKeyDown: () => seen.push('updated') })
	f.send(f.event()); assert.deepEqual(seen.slice(-2), ['updated', 'owned'])
	f.dispatcher.set(f.field); assert.deepEqual(f.removed, [])
	f.send(f.event({ type: 11 })); assert.equal(seen.at(-1), 'up')
	off(); off(); assert.deepEqual(f.removed, ['key-monitor'])
})

test('same-view subscriptions share prevention and run before stopped ancestor propagation', () => {
	const f = fixture(), seen: string[] = []
	f.dispatcher.set(f.field, { onKeyDown: (event) => { seen.push('prop'); event.stopPropagation() } })
	f.dispatcher.subscribe(f.field, { onKeyDown: (event) => { seen.push('first'); event.preventDefault() } })
	f.dispatcher.subscribe(f.field, { onKeyDown: (event) => { seen.push('second'); assert.equal(event.defaultPrevented, true) } })
	f.dispatcher.set(f.parent, { onKeyDown: () => seen.push('parent') })
	const event = f.event(); assert.equal(f.send(event), null); f.dispatcher.dispatch(event)
	assert.deepEqual(seen, ['prop', 'first', 'second'])
	f.dispatcher.dispose()
})

test('subscription mutation skips released listeners and defers listeners added during delivery', () => {
	const f = fixture(), seen: string[] = []
	let offSecond = () => {}, added = false
	f.dispatcher.subscribe(f.field, { onKeyDown: () => {
		seen.push('first'); offSecond()
		if (!added) { added = true; f.dispatcher.subscribe(f.field, { onKeyDown: () => seen.push('new') }) }
	} })
	offSecond = f.dispatcher.subscribe(f.field, { onKeyDown: () => seen.push('released') })
	f.send(f.event()); assert.deepEqual(seen, ['first'])
	f.send(f.event()); assert.deepEqual(seen, ['first', 'first', 'new'])
	f.dispatcher.dispose()
})

test('identical subscriber handlers own independent leases and disposal clears them without consuming empty registrations', () => {
	const f = fixture(); let calls = 0
	f.dispatcher.subscribe(f.field, {})(); assert.equal(f.registrations(), 0)
	const handlers = { onKeyDown: () => calls++ }, first = f.dispatcher.subscribe(f.field, handlers), second = f.dispatcher.subscribe(f.field, handlers)
	f.send(f.event()); assert.equal(calls, 2)
	first(); f.send(f.event()); assert.equal(calls, 3)
	f.dispatcher.dispose(); f.send(f.event()); assert.equal(calls, 3)
	second(); assert.deepEqual(f.removed, ['key-monitor'])
})


test('Context Menu virtual key and native function character normalize on down/up without inventing physical codes', () => {
	const env = fixture(), seen: any[] = []
	env.dispatcher.set(env.field, { onKeyDown: (event) => seen.push(event), onKeyUp: (event) => seen.push(event) })
	for (const type of [10, 11]) {
		env.send(env.event({ type, keyCode: 110, characters: '', charactersIgnoringModifiers: '' }))
		env.send(env.event({ type, keyCode: 999, characters: '\uf735', charactersIgnoringModifiers: '\uf735' }))
	}
	assert.deepEqual(seen.map(({ key, code, eventName }) => [key, code, eventName]), [
		['ContextMenu', 'ContextMenu', 'keyDown'], ['ContextMenu', '', 'keyDown'],
		['ContextMenu', 'ContextMenu', 'keyUp'], ['ContextMenu', '', 'keyUp'],
	])
	env.dispatcher.dispose()
})

test('Context Menu normalization retains modifiers, composition, field-editor target and ordinary character defaults', () => {
	const env = fixture(), seen: any[] = [], editor = { delegate: env.field, hasMarkedText: () => true }
	env.field.currentEditor = () => editor; env.window.firstResponder = editor
	env.dispatcher.set(env.field, { onKeyDown: (event) => seen.push(event) })
	const modified = env.event({ keyCode: 110, characters: '\uf735', modifierFlags: (1 << 17) | (1 << 18) | (1 << 19) | (1 << 20) })
	assert.equal(env.send(modified), modified)
	assert.equal(seen[0].key, 'ContextMenu'); assert.equal(seen[0].target, env.field)
	assert.equal(seen[0].isComposing, true)
	for (const modifier of ['shiftKey', 'ctrlKey', 'altKey', 'metaKey']) assert.equal(seen[0][modifier], true)
	env.window.firstResponder = env.field; env.field.currentEditor = null
	env.send(env.event({ keyCode: 999, characters: 'x', charactersIgnoringModifiers: 'x' }))
	assert.equal(seen[1].key, 'x'); assert.equal(seen[1].code, ''); assert.equal(seen[1].isComposing, false)
	env.dispatcher.dispose()
})
