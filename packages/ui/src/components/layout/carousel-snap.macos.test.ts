import { strict as assert } from 'node:assert'
import { test } from 'vitest'
import { createAppKitCarouselSnap } from './carousel-snap.macos.ts'
function fixture() {
	const callbacks = new Map<number, () => void>(), observers = new Map<object, { name: string; view: any; callback: (note: any) => void }>()
	const state = { enabled: true, snaps: 0, interactions: 0, id: 0, failObserver: false }, view: any = { window: {}, hidden: false }
	let current: any = view
	const timers = { set(callback: () => void, delay: number) { assert.equal(delay, 140); const id = ++state.id; callbacks.set(id, callback); return id }, clear(id: unknown) { callbacks.delete(id as number) } }
	const center = {
		addObserverForNameObjectQueueUsingBlock(name: string, object: any, _: any, callback: (note: any) => void) {
			if (state.failObserver && observers.size === 1) throw Error('native observation failed')
			const token = {}; observers.set(token, { name, view: object, callback }); return token
		},
		removeObserver(token: object) { observers.delete(token) },
	}
	const control = createAppKitCarouselSnap({ view: () => current, enabled: () => state.enabled,
		interaction: () => { state.interactions++ }, snap: () => { state.snaps++ },
	}, () => ({ NSNotificationCenter: { defaultCenter: center } }), timers)
	const send = (part: string, object: any = current) => { for (const observer of observers.values()) if (observer.name === `NSScrollView${part}Notification`) observer.callback({ object }) }
	const flush = () => { const pending = [...callbacks.values()]; callbacks.clear(); for (const callback of pending) callback() }
	control.bind(view)
	return { control, state, view, send, callbacks, observers, flush, detach: () => { current = null; control.bind(null) } }
}
test('live gesture tracking waits for end/quiet and claims exactly one snap before duplicate end events', () => {
	const f = fixture(); f.send('WillStartLiveScroll'); f.send('DidLiveScroll'); f.flush()
	assert.equal(f.state.snaps, 0); assert.equal(f.callbacks.size, 0)
	f.control.validate(); f.send('DidEndLiveScroll'); assert.equal(f.callbacks.size, 1); f.flush(); f.send('DidEndLiveScroll'); f.flush()
	assert.equal(f.state.snaps, 1); assert.equal(f.state.interactions, 2)
	f.control.dispose(); assert.equal(f.observers.size, 0)
})
test('unbracketed user events and momentum after end replace stale timers until a quiet interval', () => {
	const f = fixture(); f.send('DidLiveScroll'); const obsolete = [...f.callbacks.values()][0]
	f.send('DidLiveScroll'); obsolete(); assert.equal(f.state.snaps, 0); f.flush(); assert.equal(f.state.snaps, 1)
	f.send('WillStartLiveScroll'); f.send('DidLiveScroll'); f.send('DidEndLiveScroll'); const end = [...f.callbacks.values()][0]
	f.send('DidLiveScroll'); end(); assert.equal(f.state.snaps, 1); f.flush(); assert.equal(f.state.snaps, 2)
	f.control.dispose()
})
test('foreign notifications and cancelled/programmatic intent never replay old snaps', () => {
	const f = fixture(); f.send('DidLiveScroll', {}); f.flush(); assert.equal(f.state.snaps, 0)
	f.send('DidLiveScroll'); const obsolete = [...f.callbacks.values()][0]
	f.control.invalidate(); obsolete(); f.flush(); assert.equal(f.state.snaps, 0); assert.equal(f.callbacks.size, 0)
	f.control.dispose()
})
test('current flag, hidden/detached/moved scope and observer teardown reject captured callbacks', () => {
	for (const invalidate of [(f: ReturnType<typeof fixture>) => { f.state.enabled = false },
		(f: ReturnType<typeof fixture>) => { f.view.hidden = true }, (f: ReturnType<typeof fixture>) => { f.view.window = {} },
		(f: ReturnType<typeof fixture>) => f.detach()]) {
		const f = fixture(); f.send('DidLiveScroll'); const obsolete = [...f.callbacks.values()][0]
		invalidate(f); obsolete(); f.flush(); assert.equal(f.state.snaps, 0); f.control.dispose(); assert.equal(f.observers.size, 0)
	}
})
test('metadata invalidation preserves active tracking but requires fresh movement before end can snap', () => {
	const f = fixture(); f.send('WillStartLiveScroll'); f.send('DidLiveScroll'); f.control.invalidate()
	f.send('DidEndLiveScroll'); f.flush(); assert.equal(f.state.snaps, 0)
	f.send('WillStartLiveScroll'); f.send('DidLiveScroll'); f.control.invalidate(); f.send('DidLiveScroll'); f.flush()
	assert.equal(f.state.snaps, 0); f.send('DidEndLiveScroll'); f.flush(); assert.equal(f.state.snaps, 1)
	f.send('WillStartLiveScroll'); f.state.enabled = false; f.control.validate(); f.send('DidLiveScroll'); f.state.enabled = true
	f.send('DidEndLiveScroll'); f.flush(); assert.equal(f.state.snaps, 1); f.control.dispose()
})
test('partial notification installation cleans earlier tokens and a later bind can retry without stale callbacks', () => {
	const f = fixture(), oldObserver = [...f.observers.values()].find((observer) => observer.name === 'NSScrollViewDidLiveScrollNotification')!
	f.control.dispose(); f.state.failObserver = true
	const warn = console.warn; console.warn = () => {}
	try { f.control.bind(f.view); assert.equal(f.observers.size, 0) } finally { console.warn = warn }
	f.state.failObserver = false; f.control.bind(f.view); assert.equal(f.observers.size, 3)
	oldObserver.callback({ object: f.view }); f.flush(); assert.equal(f.state.snaps, 0)
	f.send('DidLiveScroll'); const old = [...f.callbacks.values()][0]; f.detach(); old(); assert.equal(f.state.snaps, 0)
	assert.equal(f.callbacks.size, 0); assert.equal(f.observers.size, 0)
})
