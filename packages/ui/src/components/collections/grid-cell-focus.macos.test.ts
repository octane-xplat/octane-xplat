import { expect, it } from 'vitest'
import { createAppKitGridCellFocus } from './grid-cell-focus.macos'
import { readGridCells } from '../../../../macos-renderer/src/grid-cells.ts'

// Combined controller/renderer metadata model, not compiled hooks or native input.
function fixture() {
	const nodes = new Map<object, any>(), callbacks: ((notification: any) => void)[] = [], removed: any[] = [], suppressed = new Set<any>()
	const changes: number[] = [], notices: string[] = [], releases: any[] = [], scrolls: any[] = []
	let accepts = true, readsFail = false, releaseFails = false
	const window: any = { firstResponder: null, recalculateKeyViewLoop() {}, makeFirstResponder(view: any) { if (!accepts || view.window !== window) return false; window.firstResponder = view; return true } }
	const root: any = { window, superview: null, subviews: [], userInterfaceLayoutDirection: 0 }
	const cell = (parent = root): any => {
		const view = { window, superview: parent, hidden: false, enabled: true, isAccessibilityEnabled: true, bounds: {}, frame: { origin: { y: 0 } }, subviews: [], scrollRectToVisible() { scrolls.push(view) } }
		nodes.set(view, { view, props: { 'data-grid-cell': true } }); parent.subviews.push(view); return view
	}
	for (let n = 0; n < 5; n++) cell()
	let host: any = root
	const options = { rows: 3, columns: 2, onFocusChange: (index: number) => notices.push(`A:${index}`) }
	const bridge: any = { keyboardEventsSupported: true,
		readGridCells(view: any, nested: object[]) { if (readsFail) throw Error('private read detail'); return readGridCells(view, (view) => nodes.get(view), nested) },
		suppressTabStop(view: any) { suppressed.add(view); return () => { suppressed.delete(view); releases.push(view); if (releaseFails) throw Error('private release detail') } },
	}
	const native = { NSNotificationCenter: { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock(_name: string, _object: any, _queue: any, callback: (notification: any) => void) { callbacks.push(callback); return callbacks.length },
		removeObserver(token: any) { removed.push(token) },
	} } }
	const make = (resolve = () => host) => createAppKitGridCellFocus({ root: resolve, options: () => options, changed: (index) => changes.push(index) }, () => native, () => bridge)
	const owner = make()
	const send = (key: string, extra: any = {}) => {
		const event: any = { key, target: window.firstResponder, ...extra, prevented: false, preventDefault() { this.prevented = true } }
		owner.onKeyDown(event); return event
	}
	return { root, window, nodes, options, owner, make, cell, send, changes, notices, callbacks, removed, suppressed, releases, scrolls, bridge,
		host: (next: any) => { host = next }, accepts: (next: boolean) => { accepts = next }, readsFail: (next: boolean) => { readsFail = next }, releaseFails: (next: boolean) => { releaseFails = next } }
}

it('moves and clamps by current columns, preserves edge focus and keeps programmatic requests callback-free', () => {
	const f = fixture(); f.owner.start(); const cells = f.root.subviews
	f.window.firstResponder = cells[0]
	expect(f.send('ArrowDown').prevented).toBe(true); expect(f.owner.getIndex()).toBe(2)
	f.send('ArrowRight'); expect(f.owner.getIndex()).toBe(3); f.send('End'); expect(f.owner.getIndex()).toBe(4)
	expect(f.send('ArrowRight').prevented).toBe(true); expect(f.notices).toEqual(['A:2', 'A:3', 'A:4'])
	f.owner.focusCell(-5); expect(f.owner.getIndex()).toBe(0); f.owner.focusCell(99); expect(f.owner.getIndex()).toBe(4)
	expect(f.owner.focusCell(1.5)).toBe(false); expect(f.notices).toHaveLength(3)
	expect(f.scrolls.length).toBe(5); f.owner.dispose()
})
it('skips disabled/hidden cells without compressing their indices or wrapping a blocked column', () => {
	const f = fixture(); f.root.subviews[1].enabled = false; f.root.subviews[3].hidden = true
	f.owner.start(); f.window.firstResponder = f.root.subviews[0]
	f.send('ArrowRight'); expect(f.owner.getIndex()).toBe(2)
	f.window.firstResponder = f.root.subviews[1]; expect(f.send('ArrowDown').prevented).toBe(false)
	f.root.subviews[1].enabled = true; f.window.firstResponder = f.root.subviews[1]
	expect(f.send('ArrowDown').prevented).toBe(false); expect(f.window.firstResponder).toBe(f.root.subviews[1])
	f.accepts(false); expect(f.send('End').prevented).toBe(false); expect(f.owner.getIndex()).toBe(2); f.owner.dispose()
})
it('preserves activation, editing descendants, IME, shortcuts, prevented events and foreign targets', () => {
	const f = fixture(); f.owner.start(); f.window.firstResponder = f.root.subviews[0]
	for (const key of ['Enter', ' ', 'Tab', 'Escape']) expect(f.send(key).prevented).toBe(false)
	for (const extra of [{ isComposing: true }, { altKey: true }, { ctrlKey: true }, { metaKey: true }, { defaultPrevented: true }, { target: { superview: f.root.subviews[0] } }, { target: {} }]) expect(f.send('ArrowRight', extra).prevented).toBe(false)
	expect(f.changes).toEqual([]); expect(f.notices).toEqual([]); f.owner.dispose()
})
it('uses live options/callbacks and the current native child order', () => {
	const f = fixture(); f.owner.start(); const cells = [...f.root.subviews]
	f.window.firstResponder = cells[0]; f.options.columns = 3; f.options.onFocusChange = (index) => f.notices.push(`B:${index}`)
	f.send('ArrowDown'); expect(f.window.firstResponder).toBe(cells[3]); expect(f.notices).toEqual(['B:3'])
	f.root.subviews.reverse(); f.window.firstResponder = cells[4]; f.send('ArrowRight')
	expect(f.window.firstResponder).toBe(cells[3]); expect(f.owner.getIndex()).toBe(1); expect(f.notices).toEqual(['B:3', 'B:1']); f.owner.dispose()
})
it('keeps nested hooks independent and releases their query boundaries on teardown', () => {
	const f = fixture(), inner: any = { window: f.window, superview: f.root, subviews: [] }
	f.root.subviews.push(inner); const inside = f.cell(inner), innerOwner = f.make(() => inner)
	f.owner.start(); innerOwner.start() // New boundaries repair outer leases immediately.
	expect(f.suppressed.has(inside)).toBe(false)
	f.window.firstResponder = inside; expect(f.send('ArrowLeft').prevented).toBe(false)
	expect(f.suppressed.has(inside)).toBe(false)
	innerOwner.dispose(); expect(f.suppressed.has(inside)).toBe(false)
	expect(f.send('ArrowLeft').prevented).toBe(true)
	expect(f.owner.getIndex()).toBe(4); expect(f.suppressed.has(inside)).toBe(true)
	f.owner.dispose(); expect(f.suppressed.size).toBe(0)
})
it('handles delayed refs/windows, invalid geometry and repaired/missing bridges without stale owners', () => {
	const f = fixture(); f.host(null); f.owner.start(); expect(f.owner.focusCell(0)).toBe(false)
	f.host(f.root); f.owner.synchronize(); expect(f.owner.focusCell(2)).toBe(true)
	f.root.window = null; f.owner.synchronize(); expect(f.owner.focusCell(0)).toBe(false)
	f.root.window = f.window; f.options.columns = 0; f.owner.synchronize(); expect(f.owner.available()).toBe(false); expect(f.suppressed.size).toBe(0)
	f.options.columns = 2; f.owner.synchronize(); expect(f.owner.focusCell(1)).toBe(true)
	f.bridge.readGridCells = undefined; f.owner.synchronize(); expect(f.owner.available()).toBe(false); expect(f.suppressed.size).toBe(0); f.owner.dispose()
})
it('cleans native read/release failure, retires old observer callbacks and retries with a fresh owner', () => {
	const f = fixture(); f.owner.start(); const old = f.callbacks[0]
	f.releaseFails(true); f.readsFail(true); old({ object: f.window })
	expect(f.suppressed.size).toBe(0); expect(f.removed).toEqual([1]); expect(f.releases.length).toBe(4)
	f.readsFail(false); f.releaseFails(false); f.owner.synchronize(); expect(f.suppressed.size).toBe(4)
	const before = f.releases.length; old({ object: f.window }); expect(f.releases).toHaveLength(before)
	f.owner.dispose(); f.owner.dispose(); expect(f.suppressed.size).toBe(0); expect(f.removed).toEqual([1, 2])
})
it('commits successful native movement before a consumer throws or closes the owner', () => {
	const f = fixture(); f.owner.start(); f.window.firstResponder = f.root.subviews[0]
	f.options.onFocusChange = () => { throw Error('consumer failed') }
	expect(() => f.send('ArrowRight')).toThrow('consumer failed'); expect(f.owner.getIndex()).toBe(1)
	f.options.onFocusChange = () => f.owner.dispose(); f.send('ArrowRight')
	expect(f.owner.getIndex()).toBe(2); expect(f.suppressed.size).toBe(0)
	expect(f.send('ArrowRight').prevented).toBe(false)
	const during = fixture(); during.owner.start(); during.window.firstResponder = during.root.subviews[0]
	during.window.makeFirstResponder = (view: any) => { during.window.firstResponder = view; during.owner.dispose(); return true }
	expect(during.send('ArrowRight').prevented).toBe(false); expect(during.changes).toEqual([]); expect(during.notices).toEqual([])
	const removed = fixture(); removed.owner.start(); removed.window.firstResponder = removed.root.subviews[0]
	removed.window.makeFirstResponder = (view: any) => { removed.window.firstResponder = view; removed.root.subviews = removed.root.subviews.filter((item: any) => item !== view); return true }
	expect(removed.send('ArrowRight').prevented).toBe(false); expect(removed.changes).toEqual([]); expect(removed.notices).toEqual([]); removed.owner.dispose()
})
