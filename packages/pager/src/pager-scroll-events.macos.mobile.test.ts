import { expect, it } from 'vitest'
import { createAppKitPagerEvents } from './pager-scroll-events.macos'
function fixture(fail = false) {
	const originalWindow = {}, view: any = { window: originalWindow, contentView: {} }, observers = new Map<object, any>(), timers = new Map<object, () => void>()
	let current: any = view, interactions = 0, settlements = 0, measurements = 0
	const events = createAppKitPagerEvents({ view: () => current, interaction() { interactions++ }, settle() { settlements++ }, measure() { measurements++ } },
		() => ({ NSNotificationCenter: { defaultCenter: {
			addObserverForNameObjectQueueUsingBlock(name: string, object: any, _: any, callback: any) { if (fail && observers.size === 2) throw Error('unavailable'); const token = {}; observers.set(token, { name, object, callback }); return token },
			removeObserver(token: object) { observers.delete(token) },
		} } }), { set(callback) { const token = {}; timers.set(token, callback); return token }, clear(token) { timers.delete(token as object) } })
	const emit = (part: string, object: any = view) => { for (const observer of [...observers.values()]) if (observer.name === part) observer.callback({ object }) }
	const scroll = (part: string, object = view) => emit(`NSScrollView${part}Notification`, object)
	const fire = () => { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach((callback) => callback()) }
	events.bind(view)
	return { view, events, observers, timers, emit, scroll, fire, originalWindow, set current(value: any) { current = value }, get interactions() { return interactions }, get settlements() { return settlements }, get measurements() { return measurements } }
}
it('waits for bracketed tracking and supports legacy unbracketed updates', () => {
	const f = fixture(); f.scroll('WillStartLiveScroll'); f.scroll('DidLiveScroll'); f.fire(); expect(f.settlements).toBe(0)
	f.scroll('DidEndLiveScroll'); expect(f.timers.size).toBe(1); f.fire(); expect(f.settlements).toBe(1)
	f.scroll('DidLiveScroll'); f.scroll('DidLiveScroll'); expect(f.timers.size).toBe(1); f.fire(); expect(f.settlements).toBe(2)
})
it('bounds and window updates measure without creating user requests; foreign objects are ignored', () => {
	const f = fixture(); f.emit('NSViewBoundsDidChangeNotification', f.view.contentView); f.emit('NSWindowDidUpdateNotification', f.originalWindow)
	f.scroll('DidLiveScroll', {}); expect(f.measurements).toBe(2); expect(f.interactions).toBe(0); expect(f.timers.size).toBe(0)
})
it('cancel, hidden/detached/moved scope and old timer claims cannot settle', () => {
	for (const action of ['cancel', 'hidden', 'detached', 'moved', 'replacement']) {
		const f = fixture(); f.scroll('DidLiveScroll'); const stale = [...f.timers.values()][0]
		if (action === 'cancel') f.events.cancel()
		if (action === 'hidden') f.view.hidden = true
		if (action === 'detached') { f.view.window = null; f.emit('NSWindowDidUpdateNotification', f.originalWindow); expect(f.timers.size).toBe(0) }
		if (action === 'moved') f.view.window = {}
		if (action === 'replacement') f.current = {}
		stale(); expect(f.settlements).toBe(0); f.events.dispose(); expect(f.observers.size).toBe(0)
	}
})
it('same-view rebind rejects old native callbacks and partial subscriptions clean up', () => {
	const f = fixture(), stale = [...f.observers.values()].find((o) => o.name === 'NSScrollViewDidLiveScrollNotification').callback
	f.events.bind(null); f.events.bind(f.view); stale({ object: f.view }); expect(f.interactions).toBe(0)
	f.events.dispose(); expect(f.observers.size).toBe(0)
	const partial = fixture(true); expect(partial.observers.size).toBe(0)
})
