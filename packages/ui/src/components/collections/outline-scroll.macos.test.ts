import { expect, it } from 'vitest'
import { createAppKitOutlineScroll } from './outline-scroll.macos'
import type { OutlineProps } from '../../props'

function fixture(flipped = true) {
	const window = {}, events: string[] = [], moves: any[] = [], observers: any[] = [], timers = new Map<number, () => void>()
	let nextTimer = 0, active = 'intro', reduced = false
	let props: OutlineProps = { items: [{ id: 'intro', label: 'Intro', level: 1 }, { id: 'details', label: 'Details', level: 2 }], onNavigateStart: (id) => events.push(`start:${id}`), onNavigateEnd: (id) => events.push(`end:${id}`) }
	const document: any = { frame: { size: { width: 320, height: 500 } }, flipped }
	const clip: any = { bounds: { origin: { x: 0, y: flipped ? 0 : 400 }, size: { width: 320, height: 100 } }, scrollToPoint(point: any) { moves.push({ ...point, animated: false }); clip.bounds.origin = point }, animator: () => ({ scrollToPoint(point: any) { moves.push({ ...point, animated: true }); clip.bounds.origin = point } }) }
	const view: any = { window, contentView: clip, documentView: document, reflectScrolledClipView() {} }
	const heading = (id: string, top: number) => ({ id, label: id, level: 2, view: { window, enclosingScrollView: view, bounds: {}, isDescendantOf: (root: any) => root === document, convertRectToView: () => ({ origin: { x: 0, y: flipped ? top : 500 - top - 20 }, size: { width: 200, height: 20 } }) } })
	const records = [heading('intro', 0), heading('details', 250)]
	const nav: any = { window, enclosingScrollView: view }
	const native = { NSNotificationCenter: { defaultCenter: { addObserverForNameObjectQueueUsingBlock(name: string, object: any, _queue: unknown, callback: () => void) { const token = { name, object, callback, removed: false }; observers.push(token); return token }, removeObserver(token: any) { token.removed = true } } } }
	const control = createAppKitOutlineScroll({ props: () => props, root: () => nav, active: () => props.activeId ?? active, change(id) { if (props.activeId === undefined) {active = id;} events.push(`active:${id}`); props.onActiveIdChange?.(id) }, reducedMotion: () => reduced }, () => native, () => ({ readOutlineHeadings: () => records }), { set(callback) { const id = ++nextTimer; timers.set(id, callback); return id }, clear(timer) { timers.delete(timer as number) } })
	const emit = (name: string, object: any) => { for (const token of [...observers]) {if (!token.removed && token.name === name && (token.object == null || token.object === object)) {token.callback({ object })}} }
	const tick = () => { const entry = timers.entries().next().value; expect(entry).toBeDefined(); timers.delete(entry![0]); entry![1]() }
	control.sync()
	return { control, view, clip, document, nav, records, events, moves, observers, timers, emit, tick, active: () => active, reduce: () => { reduced = true }, update(next: Partial<OutlineProps>) { props = { ...props, ...next }; control.sync() } }
}

it('seeks headings with header offset in either document orientation and balances settled callbacks', () => {
	for (const flipped of [true, false]) {
		const f = fixture(flipped)
		try {
			f.records[1].id = ''; f.update({ offset: 20 }); f.control.activate('details')
			expect(f.moves.at(-1)).toEqual({ x: 0, y: flipped ? 230 : 170, animated: true }); expect(f.events).toContain('start:details'); expect(f.events).not.toContain('end:details')
			f.emit('NSViewBoundsDidChangeNotification', f.clip); f.tick(); expect(f.events.filter((event) => event === 'end:details')).toHaveLength(1); expect(f.active()).toBe('details')
		} finally { f.control.dispose() }
	}
})
it('scroll spy reads live positions, respects controlled activeId and uses an explicit portable scroll handle', () => {
	const f = fixture()
	try {
		f.update({ scrollContainerRef: { current: { native: f.view } as any } }); f.clip.bounds.origin.y = 300; f.emit('NSViewBoundsDidChangeNotification', f.clip); expect(f.active()).toBe('details')
		f.update({ activeId: 'intro' }); f.clip.bounds.origin.y = 0; const count = f.events.length; f.emit('NSViewBoundsDidChangeNotification', f.clip); expect(f.events).toHaveLength(count)
		f.update({ activeId: undefined }); expect(f.active()).toBe('intro')
	} finally { f.control.dispose() }
})
it('reduced motion seeks instantly; disabled click scrolling and invalid targets still balance navigation without moving', () => {
	const f = fixture()
	try {
		f.reduce(); f.control.activate('details'); expect(f.moves.at(-1).animated).toBe(false); f.tick()
		f.update({ hasScrollOnClick: false }); const count = f.moves.length; f.control.activate('intro'); expect(f.moves).toHaveLength(count); expect(f.events.at(-1)).toBe('end:intro')
		f.update({ hasScrollOnClick: true }); f.records[1].view.window = {}; f.control.activate('details'); expect(f.moves).toHaveLength(count); expect(f.events.at(-1)).toBe('end:details')
	} finally { f.control.dispose() }
})
it('live-scroll interruption and replacement retire timers/observers and use current end callbacks once', () => {
	const f = fixture()
	try {
		f.control.activate('details'); const retired = [...f.timers.values()][0]; f.update({ onNavigateEnd: (id) => f.events.push(`current-end:${id}`) })
		f.emit('NSScrollViewWillStartLiveScrollNotification', f.view); retired(); expect(f.events.filter((event) => event === 'current-end:details')).toHaveLength(1); expect(f.timers.size).toBe(0)
		f.control.activate('details'); const old = f.observers.filter((token) => token.object === f.clip); f.nav.enclosingScrollView = null; f.control.sync(); expect(old.every((token) => token.removed)).toBe(true); expect(f.events.filter((event) => event === 'current-end:details')).toHaveLength(2)
	} finally { f.control.dispose() }
})
it('reentrant navigation in start callback retires its outer attempt and leaves only the new timer owner', () => {
	const f = fixture()
	try {
		f.update({ onNavigateStart: (id) => { f.events.push(`start:${id}`); if (id === 'details') {f.control.activate('intro')} } }); f.control.activate('details')
		expect(f.events.filter((event) => event === 'end:details')).toHaveLength(1); expect(f.moves).toHaveLength(1); expect(f.timers.size).toBe(1); f.tick(); expect(f.events.filter((event) => event === 'end:intro')).toHaveLength(1)
	} finally { f.control.dispose() }
})
it('disposal during navigation start balances once, releases every observer and makes late work inert', () => {
	const f = fixture()
	f.update({ onNavigateStart: (id) => { f.events.push(`start:${id}`); f.control.dispose() } }); f.control.activate('details')
	expect(f.moves).toHaveLength(0); expect(f.events.filter((event) => event === 'end:details')).toHaveLength(1); expect(f.observers.every((token) => token.removed)).toBe(true); expect(f.timers.size).toBe(0)
	const count = f.events.length; for (const token of f.observers) {token.callback({ object: token.object });} f.control.activate('intro'); f.control.sync(); expect(f.events).toHaveLength(count)
})
