import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createAppKitFileDropRegistry } from '../src/file-drop.ts'
function fixture(initial: string[] = []) {
	let types = initial, mask = 1, readable = true, enabled = true
	const reads: any[] = [], received: string[][] = [], changes: string[][] = []
	const native = { NSURL: {}, NSPasteboardURLReadingFileURLsOnlyKey: 'files-only' }
	const url = { isFileURL: true, absoluteString: 'file:///a.txt' }
	const board = { canReadObjectForClassesOptions: (classes: any, options: any) => { reads.push([classes, options]); return readable },
		readObjectsForClassesOptions: () => [url, url, { isFileURL: false, absoluteString: 'https://example.test' }] }
	const window = {}
	const sender = { draggingDestinationWindow: window, get draggingSourceOperationMask() { return mask }, draggingPasteboard: board }
	const view = { window, get registeredDraggedTypes() { return types },
		registerForDraggedTypes(next: string[]) { types = next; changes.push(next) }, unregisterDraggedTypes() { types = [] } }
	const registry = createAppKitFileDropRegistry(() => native)
	const handlers = { enabled: () => enabled, receive: (uris: string[]) => { received.push(uris); return true } }
	return { registry, native, sender, view, reads, received, changes, handlers,
		mask: (next: number) => { mask = next }, readable: (next: boolean) => { readable = next }, enabled: (next: boolean) => { enabled = next } }
}
test('file destinations advertise copy and deliver deduplicated file URLs only to live enabled owners', () => {
	const f = fixture(), off = f.registry.subscribe(f.view, f.handlers)
	assert.equal(f.registry.operation(f.view, f.sender), 1)
	assert.deepEqual(f.reads[0], [[f.native.NSURL], { 'files-only': true }])
	assert.equal(f.registry.operation(f.view, { ...f.sender, draggingDestinationWindow: {} }), 0)
	assert.equal(f.registry.perform(f.view, f.sender), true); assert.deepEqual(f.received, [['file:///a.txt']])
	f.enabled(false); assert.equal(f.registry.operation(f.view, f.sender), 0); assert.equal(f.registry.perform(f.view, f.sender), false)
	f.enabled(true); f.mask(2); assert.equal(f.registry.perform(f.view, f.sender), false)
	f.mask(1); f.readable(false); assert.equal(f.registry.operation(f.view, f.sender), 0)
	f.readable(true); off(); assert.equal(f.registry.perform(f.view, f.sender), false)
	assert.equal(f.received.length, 1)
})
test('independent file leases preserve original and later drag types and release only their own registration', () => {
	const f = fixture(['public.text']), a = f.registry.subscribe(f.view, f.handlers), b = f.registry.subscribe(f.view, f.handlers)
	assert.deepEqual(f.view.registeredDraggedTypes, ['public.text', 'public.file-url'])
	a(); a(); assert.equal(f.registry.operation(f.view, f.sender), 1)
	f.view.registerForDraggedTypes([...f.view.registeredDraggedTypes, 'custom-type']); b()
	assert.deepEqual(f.view.registeredDraggedTypes, ['public.text', 'custom-type'])
	const prior = fixture(['public.file-url']); prior.registry.subscribe(prior.view, prior.handlers)()
	assert.deepEqual(prior.view.registeredDraggedTypes, ['public.file-url']); assert.equal(prior.changes.length, 0)
})
test('destination delivery declines empty/foreign payloads, detached views, and owners released during admission', () => {
	const f = fixture(); const off = f.registry.subscribe(f.view, { enabled: () => { off(); return true }, receive: f.handlers.receive })
	assert.equal(f.registry.perform(f.view, f.sender), false); assert.deepEqual(f.received, [])
	f.registry.subscribe(f.view, f.handlers); f.view.window = null as any
	assert.equal(f.registry.operation(f.view, f.sender), 0)
	f.view.window = {}; f.sender.draggingPasteboard.readObjectsForClassesOptions = () => []
	assert.equal(f.registry.perform(f.view, f.sender), false)
})
test('registration failures retain no owner and delivery faults report failure', (t) => {
	t.mock.method(console, 'error', () => {})
	const f = fixture(); f.registry.subscribe(f.view, { enabled: () => true, receive: () => { throw new Error('drop') } })
	assert.equal(f.registry.perform(f.view, f.sender), false)
	const other = fixture(); other.view.registerForDraggedTypes = () => { throw new Error('register') }
	assert.throws(() => other.registry.subscribe(other.view, other.handlers), /register/)
	assert.equal(other.registry.operation(other.view, other.sender), 0)
})
