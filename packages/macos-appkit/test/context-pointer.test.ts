import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createAppKitContextPointerDispatcher } from '../src/context-pointer.ts'
import { appKitMouseHit } from '../src/primary-click.ts'

function fixture() {
	let monitor = (event: any): any => event, registrations = 0, hit: any
	const removed: unknown[] = [], points: unknown[] = [], converted: unknown[] = []
	const native = { NSEvent: {
		addLocalMonitorForEventsMatchingMaskHandler: (_mask: number, callback: typeof monitor) => { monitor = callback; registrations++; return 'pointer-monitor' },
		removeMonitor: (token: unknown) => removed.push(token),
	} }
	const window: any = {}, frame: any = { convertPointFromView: (point: unknown, from: unknown) => { converted.push([point, from]); return { x: 4, y: 8 } } }
	window.contentView = { superview: frame, hitTest: (point: unknown) => { points.push(point); return hit } }
	const parent: any = { window, superview: null }, child: any = { window, superview: parent }, label: any = { window, superview: child }
	hit = label
	const dispatcher = createAppKitContextPointerDispatcher((event) => appKitMouseHit(event.window, event.locationInWindow), () => native)
	const event = (extra = {}) => ({ type: 3, modifierFlags: 0, window, locationInWindow: { x: 10, y: 20 }, ...extra })
	return { dispatcher, native, window, parent, child, label, points, converted, removed, event,
		hit: (value: any) => { hit = value }, send: (event: any) => monitor(event), registrations: () => registrations }
}

test('secondary hit routing observes first, chooses the nearest owner and deduplicates native events', () => {
	const f = fixture(), seen: unknown[] = []
	f.dispatcher.observe(() => seen.push('pointer'))
	f.dispatcher.subscribe(f.parent, () => { seen.push('parent'); return true })
	f.dispatcher.subscribe(f.child, (target) => { seen.push(target); return true })
	const event = f.event(); assert.equal(f.send(event), null)
	assert.deepEqual(seen, ['pointer', f.label]); assert.deepEqual(f.points, [{ x: 4, y: 8 }])
	assert.deepEqual(f.converted, [[event.locationInWindow, null]])
	assert.equal(f.dispatcher.dispatch(event).handled, true); assert.equal(seen.length, 2)
	assert.equal(f.registrations(), 1); f.dispatcher.dispose()
})

test('plain Control-primary opens context while ordinary or modified primary and other mouse buttons keep native defaults', () => {
	const f = fixture(); let contexts = 0, pointers = 0
	f.dispatcher.observe(() => pointers++)
	f.dispatcher.subscribe(f.parent, () => { contexts++; return true })
	assert.equal(f.send(f.event({ type: 1, modifierFlags: 1 << 18 })), null)
	for (const extra of [{ type: 1 }, { type: 1, modifierFlags: (1 << 18) | (1 << 20) },
		{ type: 1, modifierFlags: (1 << 18) | (1 << 19) }, { type: 1, modifierFlags: (1 << 18) | (1 << 17) }, { type: 25 }, { type: 10 }]) {
		const event = f.event(extra); assert.equal(f.send(event), event)
	}
	assert.equal(contexts, 1); assert.equal(pointers, 6); f.dispatcher.dispose()
})

test('declining owners allow ancestors while foreign, outside and invalid hits remain unclaimed', () => {
	const f = fixture(), seen: string[] = []
	f.dispatcher.subscribe(f.child, () => { seen.push('decline'); return false })
	f.dispatcher.subscribe(f.parent, () => { seen.push('parent'); return true })
	assert.equal(f.send(f.event()), null); assert.deepEqual(seen, ['decline', 'parent'])
	for (const hit of [null, { window: {}, superview: f.parent }, { window: f.window, superview: null }]) {
		f.hit(hit); const event = f.event(); assert.equal(f.send(event), event)
	}
	f.hit(f.label); const invalid = f.event({ locationInWindow: { x: NaN, y: 0 } }); assert.equal(f.send(invalid), invalid)
	assert.equal(seen.length, 2); f.dispatcher.dispose()
})

test('independent leases and pointer observers retain one monitor and release their own registrations', () => {
	const f = fixture(); let calls = 0
	const handler = () => { calls++; return false }
	const a = f.dispatcher.subscribe(f.child, handler), b = f.dispatcher.subscribe(f.child, handler), off = f.dispatcher.observe(() => {})
	f.send(f.event()); assert.equal(calls, 2)
	a(); a(); f.send(f.event()); assert.equal(calls, 3)
	b(); assert.deepEqual(f.removed, [])
	off(); assert.deepEqual(f.removed, ['pointer-monitor'])
	f.send(f.event()); assert.equal(calls, 3)
})

test('missing/failed monitoring reports unavailable and disposal prevents further delivery', () => {
	assert.equal(createAppKitContextPointerDispatcher(() => null, () => ({})).available(), false)
	const f = fixture(); let calls = 0
	f.dispatcher.subscribe(f.parent, () => { calls++; return true }); f.dispatcher.dispose()
	const event = f.event(); assert.equal(f.send(event), event); assert.equal(calls, 0)
	const failed = fixture(); failed.native.NSEvent.addLocalMonitorForEventsMatchingMaskHandler = () => { throw new Error('unavailable') }
	const off = failed.dispatcher.observe(() => {}); assert.equal(failed.dispatcher.available(), false); off()
})
