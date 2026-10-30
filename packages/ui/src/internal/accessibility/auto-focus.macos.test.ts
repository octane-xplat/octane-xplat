import { strict as assert } from 'node:assert'
import { test } from 'vitest'
import { createAppKitAutoFocus } from './auto-focus.macos'
const tick = async () => { await Promise.resolve(); await Promise.resolve() }
function fixture(mode = 'normal') {
	const calls: unknown[] = [], observers = new Map<object, any>(), monitors = new Map<object, (event: unknown) => unknown>()
	let requested = true, blocked = false
	const window: any = { firstResponder: {}, makeFirstResponder(view: unknown) { calls.push(view); if (mode !== 'refuse') {window.firstResponder = view;} return mode !== 'refuse' } }
	const view: any = { window: null, hidden: false }
	const host: any = { NSNotificationCenter: { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock(name: string, _: unknown, __: unknown, callback: any) { if (mode === 'partial' && observers.size) {throw Error('unavailable');} const token = {}; observers.set(token, { name, callback }); return token },
		removeObserver(token: object) { observers.delete(token) },
	} }, NSEvent: {
		addLocalMonitorForEventsMatchingMaskHandler(_: number, callback: any) { const token = {}; monitors.set(token, callback); return token },
		removeMonitor(token: object) { monitors.delete(token) },
	} }
	if (mode === 'missing') {delete host.NSEvent}
	const control = createAppKitAutoFocus({ requested: () => requested, blocked: () => blocked }, () => host)
	const emit = (object: unknown = window, name = 'NSWindowDidUpdateNotification') => { for (const observer of [...observers.values()]) {if (observer.name === name) {observer.callback({ object })}} }
	return { control, view, window, calls, observers, monitors, emit, set requested(value: boolean) { requested = value }, set blocked(value: boolean) { blocked = value } }
}
test('waits for initial window attachment, ignores foreign updates, then claims once and releases observation', async () => {
	const f = fixture(); f.control.bind(f.view); await tick(); assert.equal(f.calls.length, 0); assert.equal(f.observers.size, 2)
	f.view.window = f.window; f.emit({}); await tick(); assert.equal(f.calls.length, 0)
	f.emit(); await tick(); assert.deepEqual(f.calls, [f.view]); assert.equal(f.observers.size, 0); assert.equal(f.monitors.size, 0)
	f.control.update(); f.emit(); await tick(); assert.equal(f.calls.length, 1)
})
test('a request armed before its first ref waits for that ref and queues after commit', async () => {
	const f = fixture(); f.control.update(); await tick(); assert.equal(f.calls.length, 0)
	f.view.window = f.window; f.control.bind(f.view); assert.equal(f.calls.length, 0); await tick(); assert.deepEqual(f.calls, [f.view])
})
test('native input or application deactivation retires a delayed request without consuming events', async () => {
	for (const reason of ['key', 'pointer', 'inactive']) {
		const f = fixture(); f.control.bind(f.view); const callbacks = [...f.observers.values()]
		if (reason === 'inactive') {f.emit({}, 'NSApplicationDidResignActiveNotification')}
		else { const event = { type: reason === 'key' ? 10 : 1 }; assert.equal([...f.monitors.values()][0](event), event) }
		f.view.window = f.window; callbacks.forEach((observer) => observer.callback({ object: f.window })); await tick()
		assert.equal(f.calls.length, 0); assert.equal(f.observers.size, 0); assert.equal(f.monitors.size, 0)
	}
})
test('hidden attachment waits, but changed responders, detach and window moves cancel the old intent', async () => {
	for (const reason of ['visible', 'responder', 'detach', 'move']) {
		const f = fixture(); f.view.window = f.window; f.view.hidden = () => true; f.control.bind(f.view); await tick(); assert.equal(f.calls.length, 0)
		f.view.hidden = false
		if (reason === 'responder') {f.window.firstResponder = {}}
		if (reason === 'detach') {f.view.window = null}
		if (reason === 'move') {f.view.window = { firstResponder: null, makeFirstResponder() { throw Error('foreign window') } }}
		f.emit(); await tick(); assert.equal(f.calls.length, reason === 'visible' ? 1 : 0); assert.equal(f.observers.size, 0)
	}
})
test('live blocking/removal cancels; unblocking alone does not rearm, while false-to-true does', async () => {
	for (const reason of ['blocked', 'disabled', 'flag']) {
		const f = fixture(); f.view.window = f.window; f.control.bind(f.view)
		if (reason === 'blocked') {f.blocked = true}
		if (reason === 'disabled') {f.view.enabled = () => false}
		if (reason === 'flag') {f.requested = false}
		await tick(); assert.equal(f.calls.length, 0)
		f.blocked = false; f.view.enabled = true; f.requested = true; f.control.update(); await tick(); assert.equal(f.calls.length, 0)
		f.requested = false; f.control.update(); f.requested = true; f.control.update(); await tick(); assert.equal(f.calls.length, 1)
	}
})
test('ref replacement, teardown and retained callbacks cannot focus either retired or replacement hosts', async () => {
	for (const dispose of [false, true]) {
		const f = fixture(); f.control.bind(f.view); const callbacks = [...f.observers.values()], replacement: any = { window: f.window }
		if (dispose) {f.control.dispose();} else {f.control.bind(replacement)}
		f.view.window = f.window; callbacks.forEach((o) => o.callback({ object: f.window })); await tick()
		assert.equal(f.calls.length, 0); assert.equal(f.observers.size, 0); assert.equal(f.monitors.size, 0)
	}
})
test('missing/partial observation permits an attached post-commit attempt but no unsafe delayed retry', async () => {
	for (const mode of ['missing', 'partial']) {
		for (const attached of [false, true]) {
			const f = fixture(mode); if (attached) {f.view.window = f.window}
			f.control.bind(f.view); await tick(); assert.equal(f.calls.length, attached ? 1 : 0)
			f.view.window = f.window; f.control.update(); await tick(); assert.equal(f.calls.length, attached ? 1 : 0)
			assert.equal(f.observers.size, 0); assert.equal(f.monitors.size, 0)
		}
	}
})
test('already-owned field editors and native refusal do not create repeated focus requests', async () => {
	const f = fixture(); f.view.window = f.window; const editor = {}; f.view.currentEditor = () => editor; f.window.firstResponder = editor
	f.control.bind(f.view); await tick(); assert.equal(f.calls.length, 0); assert.equal(f.observers.size, 0)
	const refused = fixture('refuse'), initial = refused.window.firstResponder; refused.view.window = refused.window; refused.control.bind(refused.view); await tick(); refused.control.update(); await tick(); assert.equal(refused.calls.length, 1); assert.equal(refused.window.firstResponder, initial)
})
test('two pending fields attached in one commit preserve the first successful responder claim', async () => {
	const first = fixture(), second = fixture(); first.control.bind(first.view); second.control.bind(second.view)
	first.view.window = first.window; second.view.window = first.window
	await tick(); assert.deepEqual(first.calls, [first.view]); assert.equal(second.calls.length, 0); assert.equal(second.observers.size, 0)
})
