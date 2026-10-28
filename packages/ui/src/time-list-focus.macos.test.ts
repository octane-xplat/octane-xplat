import { expect, it, vi } from 'vitest'
import { createAppKitTimeListFocus } from './time-list-focus.macos'
function fixture(supported = true) {
	let rows = ['09:00', '09:15', '09:30', '09:45'].map((time) => ({ time, label: time })), seed = '09:17', blocked = false
	const chosen = vi.fn(), tab = vi.fn(() => true), highlight = vi.fn(), claims = new Set<object>(), observers = new Map<object, (note: any) => void>()
	const window: any = { firstResponder: null, recalculateKeyViewLoop() {}, makeFirstResponder(view: any) {
		if (view.window !== this || !view.isAccessibilityEnabled()) return false
		this.firstResponder = view; return true
	} }
	let children: any[] = [], releases: (() => void)[] = []
	const root: any = { window, hidden: false, subviews: { get count() { return children.length }, objectAtIndex: (i: number) => children[i] } }
	const views = new Map<string, any>()
	const focus = createAppKitTimeListFocus({ rows: () => rows, seed: () => seed, blocked: () => blocked,
		choose: chosen, tab, highlight }, () => ({ keyboardEventsSupported: supported, suppressTabStop(view: object) { claims.add(view); return () => claims.delete(view) } }),
		() => ({ NSNotificationCenter: { defaultCenter: {
			addObserverForNameObjectQueueUsingBlock(_name: string, _window: unknown, _queue: unknown, fn: (note: any) => void) { const token = {}; observers.set(token, fn); return token },
			removeObserver(token: object) { observers.delete(token) },
		} } }))
	const render = () => {
		for (const release of releases) release()
		releases = []; children = []; views.clear()
		for (const row of rows) {
			const view = { window: root.window, superview: root, hidden: false, bounds: {}, scrollRectToVisible: vi.fn(), isAccessibilityEnabled: () => !blocked }
			children.push(view); views.set(row.time, view); releases.push(focus.register(row.time, view))
		}
		focus.update()
	}
	focus.bind(root); render()
	const key = (key: string, extra = {}) => {
		let prevented = false, stopped = false
		focus.keyDown({ key, target: root.window?.firstResponder, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, isComposing: false,
			get defaultPrevented() { return prevented }, preventDefault: () => { prevented = true }, stopPropagation: () => { stopped = true }, ...extra } as any)
		return { prevented, stopped }
	}
	return { focus, window, root, views, claims, observers, chosen, tab, highlight, render, key,
		rows: (times: string[]) => { rows = times.map((time) => ({ time, label: time })) }, seed: (value: string) => { seed = value }, blocked: (value: boolean) => { blocked = value } }
}
it('seeds nearest available time and uses bounded arrows/Home/End without selecting or wrapping', async () => {
	const f = fixture()
	try {
		await Promise.resolve(); expect(f.window.firstResponder).toBe(f.views.get('09:30')); expect(f.claims.size).toBe(3)
		f.key('ArrowDown'); f.key('ArrowDown'); expect(f.window.firstResponder).toBe(f.views.get('09:45'))
		f.key('Home'); f.key('ArrowUp'); expect(f.window.firstResponder).toBe(f.views.get('09:00'))
		f.key('End'); expect(f.highlight).toHaveBeenLastCalledWith('09:45'); expect(f.chosen).not.toHaveBeenCalled()
		f.key('Enter'); f.key(' '); expect(f.chosen.mock.calls).toEqual([['09:45'], ['09:45']])
	} finally { f.focus.dispose() }
})
it('native Tab delegates return intent while Escape/IME/modifiers/foreign/default-prevented input remain outside selection', async () => {
	const f = fixture()
	try {
		await Promise.resolve()
		expect(f.key('Tab', { shiftKey: true }).prevented).toBe(true); expect(f.tab).toHaveBeenCalledWith(true)
		f.tab.mockReturnValue(false); expect(f.key('Tab').prevented).toBe(false)
		for (const extra of [{ isComposing: true }, { altKey: true }, { ctrlKey: true }, { metaKey: true }, { defaultPrevented: true }, { target: {} }]) {
			expect(f.key('ArrowDown', extra).stopped).toBe(false)
		}
		expect(f.key('Escape').prevented).toBe(false); expect(f.chosen).not.toHaveBeenCalled()
	} finally { f.focus.dispose() }
})
it('reconciles changed options and blocking, then releases observers/claims and rejects stale or removed choices', async () => {
	const f = fixture()
	await Promise.resolve(); f.rows(['10:00', '10:15']); f.render(); await Promise.resolve()
	expect(f.window.firstResponder).toBe(f.views.get('10:00'))
	f.focus.activate('09:30'); expect(f.chosen).not.toHaveBeenCalled()
	f.blocked(true); f.focus.update(); await Promise.resolve(); expect(f.claims.size).toBe(0)
	f.focus.activate('10:00'); expect(f.chosen).not.toHaveBeenCalled()
	f.focus.dispose(); expect(f.observers.size).toBe(0); expect(f.claims.size).toBe(0)
	f.blocked(false); f.focus.activate('10:00'); f.key('Enter'); expect(f.chosen).not.toHaveBeenCalled()
})
it('older bridges retain pointer choices and empty or hidden lists have no retained Tab claims', async () => {
	const f = fixture(false)
	try {
		await Promise.resolve(); expect(f.claims.size).toBe(0); expect(f.observers.size).toBe(0)
		f.focus.activate('09:15'); expect(f.chosen).toHaveBeenCalledWith('09:15')
		expect(f.key('ArrowDown').prevented).toBe(false)
	} finally { f.focus.dispose() }
	const hidden = fixture()
	try {
		await Promise.resolve(); hidden.root.hidden = true; hidden.focus.update(); await Promise.resolve(); expect(hidden.claims.size).toBe(0)
		hidden.rows([]); hidden.root.hidden = false; hidden.render(); await Promise.resolve(); expect(hidden.claims.size).toBe(0)
	} finally { hidden.focus.dispose() }
})
