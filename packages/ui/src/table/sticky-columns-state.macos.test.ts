import { expect, it } from 'vitest'
import { appKitStickyOffset, createAppKitStickyColumns } from './sticky-columns-state.macos'

it('positions contiguous start/end runs from actual expanded widths, clamped to the row, with RTL edges mirrored', () => {
	const first = { x: 0, width: 180, rowX: 0, rowWidth: 1000 }, last = { x: 860, width: 140, rowX: 0, rowWidth: 1000 }
	expect(appKitStickyOffset(first, 200, 400, 'start', 'ltr')).toBe(200)
	expect(appKitStickyOffset(last, 0, 400, 'end', 'ltr')).toBe(-600)
	expect(appKitStickyOffset(last, 200, 400, 'start', 'rtl')).toBe(-400)
	expect(appKitStickyOffset(first, 200, 400, 'end', 'rtl')).toBe(200)
	// This cell follows a 360px expanded proportional column, not its declared minimum.
	expect(appKitStickyOffset({ x: 360, width: 140, rowX: 0, rowWidth: 1000 }, 200, 400, 'start', 'ltr')).toBe(200)
	expect(appKitStickyOffset(first, 2000, 400, 'start', 'ltr')).toBe(820)
	expect(appKitStickyOffset(first, 0, 0, 'start', 'ltr')).toBe(0)
})
function setup() {
	const window = {}, clip = { bounds: { origin: { x: 200 }, size: { width: 400 } } }, document = {}
	const viewport: { window: object | undefined; contentView: typeof clip; documentView: typeof document } = { window, contentView: clip, documentView: document }
	const observations: { name: string; object: unknown; callback(note: { object: unknown }): void; removed?: boolean }[] = []
	const native = { NSNotificationCenter: { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock: (name: string, object: unknown, _queue: unknown, callback: (note: { object: unknown }) => void) => {
			const token = { name, object, callback }; observations.push(token); return token
		},
		removeObserver: (token: typeof observations[number]) => { token.removed = true },
	} } }
	const writes: [number, number][] = [], releases: object[] = []
	let retains = 0
	const cell: Record<string, any> = { window, hidden: false, isDescendantOf: (view: object) => view === document }
	const control = createAppKitStickyColumns({ direction: () => 'ltr', retain: () => {
		retains++
		return { read: () => ({ x: 0, width: 180, rowX: 0, rowWidth: 1000 }), update: (offset, priority) => writes.push([offset, priority]), release: () => { releases.push({}) } }
	} }, () => native)
	return { control, viewport, clip, cell, observations, writes, releases, get retains() { return retains } }
}
const tick = async () => { await Promise.resolve(); await Promise.resolve() }
it('coalesces geometry changes and retires cells/observers on disposal; late notifications cannot write', async () => {
	const s = setup(), ref = s.control.cell('start')
	ref(s.cell); s.control.bind(s.viewport); await tick()
	expect(s.retains).toBe(1); expect(s.writes.at(-1)).toEqual([200, 2]); expect(s.observations).toHaveLength(4)
	const notification = s.observations[0]!
	s.clip.bounds.origin.x = 250
	notification.callback({ object: s.clip }); notification.callback({ object: s.clip }); await tick()
	expect(s.writes).toHaveLength(2); expect(s.writes.at(-1)).toEqual([250, 2])
	s.control.dispose(); s.control.dispose(); const count = s.writes.length
	notification.callback({ object: s.clip }); await tick()
	expect(s.writes).toHaveLength(count); expect(s.releases).toHaveLength(1); expect(s.observations.every((token) => token.removed)).toBe(true)
})
it('hidden/detached cells drop native placement and can reacquire current geometry', async () => {
	const s = setup(); s.control.cell('start')(s.cell); s.control.bind(s.viewport); await tick()
	s.cell.hidden = true; s.control.sync(); await tick(); expect(s.releases).toHaveLength(1)
	s.cell.hidden = false; s.control.sync(); await tick(); expect(s.retains).toBe(2)
	s.cell.window = {}; s.control.sync(); await tick(); expect(s.releases).toHaveLength(2)
})
it('replacing the viewport invalidates queued work and old window notifications', async () => {
	const s = setup(); s.control.cell('start')(s.cell); s.control.bind(s.viewport); await tick()
	const old = s.observations[0]!, count = s.writes.length
	s.control.bind({ window: {}, contentView: s.clip, documentView: {} })
	old.callback({ object: s.clip }); await tick()
	expect(s.writes).toHaveLength(count); expect(s.releases).toHaveLength(1)
	s.control.dispose()
})
it('missing native observation never acquires a placement lease', async () => {
	let retains = 0
	const control = createAppKitStickyColumns({ direction: () => 'ltr', retain: () => { retains++; return undefined } }, () => ({}))
	const document = {}, window = {}
	control.cell('end')({ window, isDescendantOf: () => true })
	control.bind({ window, documentView: document, contentView: { bounds: { origin: { x: 0 }, size: { width: 400 } } } }); await tick()
	expect(retains).toBe(0); control.dispose()
})
it('observes before initial window attachment and acquires placement after that window updates', async () => {
	const s = setup(), window = s.viewport.window!
	s.viewport.window = undefined
	s.cell.window = null
	s.control.cell('start')(s.cell); s.control.bind(s.viewport); await tick()
	expect(s.retains).toBe(0); expect(s.observations).toHaveLength(4)
	s.viewport.window = window; s.cell.window = window
	s.observations[3]!.callback({ object: window }); await tick()
	expect(s.retains).toBe(1); expect(s.writes.at(-1)).toEqual([200, 2]); s.control.dispose()
})
