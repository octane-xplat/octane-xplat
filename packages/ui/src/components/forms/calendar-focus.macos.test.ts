import { expect, it, vi } from 'vitest'
import { createAppKitCalendarFocus } from './calendar-focus.macos'
import { buildMonthGrid } from './calendar-core'
function fixture(two = false, supported = true) {
	const claims = new Map<object, number>(), observers = new Map<object, (note: any) => void>(), picked = vi.fn(), navigate = vi.fn()
	const state: any = { months: [buildMonthGrid(2026, 3, 1), ...(two ? [buildMonthGrid(2026, 4, 1)] : [])],
		value: '2026-03-05', mode: 'single', rangeAnchor: null, direction: 'ltr', isDisabled: () => false }
	const window: any = { firstResponder: null, recalculateKeyViewLoop: vi.fn(), makeFirstResponder(view: any) {
		if (view.window !== this || view.hidden || !view.isAccessibilityEnabled()) {return false}
		this.firstResponder = view; return true
	} }
	let children: any[] = [], releases: (() => void)[] = []
	const root: any = { window, hidden: false, subviews: { get count() { return children.length }, objectAtIndex: (i: number) => children[i] } }
	const bridge = { keyboardEventsSupported: supported, suppressTabStop(view: object) {
		claims.set(view, (claims.get(view) ?? 0) + 1)
		return () => { const n = (claims.get(view) ?? 1) - 1; if (n) {claims.set(view, n);} else {claims.delete(view)} }
	} }
	const native = { NSNotificationCenter: { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock(_name: string, _owner: unknown, _queue: unknown, fn: (note: any) => void) { const token = {}; observers.set(token, fn); return token },
		removeObserver(token: object) { observers.delete(token) },
	} } }
	const cancel = vi.fn(() => { state.rangeAnchor = null })
	const focus = createAppKitCalendarFocus({ current: () => state, navigate, pick: picked, cancelRange: cancel }, () => bridge, () => native)
	const views = new Map<string, any>()
	const render = () => {
		for (const off of releases) {off()}
		releases = []; children = []; views.clear()
		for (const day of state.months.flatMap((month: any) => month.weeks.flat()).filter((day: any) => !day.isOutsideMonth)) {
			const view = { window: root.window, superview: root, hidden: false, bounds: {}, scrollRectToVisible: vi.fn(), isAccessibilityEnabled: () => !state.isDisabled(day.date) }
			children.push(view); views.set(day.iso, view); releases.push(focus.register(day.iso, view))
		}
		focus.update()
	}
	focus.bind(root); render()
	const key = (key: string, extra = {}) => {
		let prevented = false, stopped = false
		focus.keyDown({ key, target: root.window.firstResponder, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, isComposing: false,
			get defaultPrevented() { return prevented }, preventDefault: () => { prevented = true }, stopPropagation: () => { stopped = true }, ...extra } as any)
		return { prevented, stopped }
	}
	return { focus, state, root, window, views, claims, observers, picked, navigate, cancel, render, key }
}
const flush = () => Promise.resolve()

it('uses one day Tab stop across panes and moves through shared bounded/RTL/row/grid navigation without selecting', async () => {
	const f = fixture(true)
	try {
		await flush(); expect(f.claims.size).toBe(60); expect(f.claims.has(f.views.get('2026-03-05'))).toBe(false)
		f.state.isDisabled = (date: any) => date.month === 3 && [12, 19].includes(date.day)
		f.window.firstResponder = f.views.get('2026-03-05')
		expect(f.key('ArrowDown')).toEqual({ prevented: true, stopped: true })
		expect(f.window.firstResponder).toBe(f.views.get('2026-03-26'))
		f.state.direction = 'rtl'; f.key('ArrowRight'); expect(f.window.firstResponder).toBe(f.views.get('2026-03-25'))
		f.key('Home'); expect(f.window.firstResponder).toBe(f.views.get('2026-03-23'))
		f.key('End', { metaKey: true }); expect(f.window.firstResponder).toBe(f.views.get('2026-04-30'))
		expect(f.picked).not.toHaveBeenCalled()
	} finally { f.focus.dispose() }
})

it('keeps page focus pending through controlled rejection and applies it only after the requested cells attach', async () => {
	const f = fixture()
	try {
		await flush(); f.window.firstResponder = f.views.get('2026-03-31')
		f.key('ArrowRight'); expect(f.navigate).toHaveBeenCalledWith('2026-04-01')
		await flush(); expect(f.window.firstResponder).toBe(f.views.get('2026-03-31'))
		f.state.months = [buildMonthGrid(2026, 4, 1)]; f.render(); await flush()
		expect(f.window.firstResponder).toBe(f.views.get('2026-04-01')); expect(f.picked).not.toHaveBeenCalled()
	} finally { f.focus.dispose() }
})

it('manual activation follows parent state and range Escape stays local while header/IME/modified/foreign keys retain ownership', async () => {
	const f = fixture()
	try {
		await flush(); const day = f.views.get('2026-03-05'); f.window.firstResponder = day
		for (const extra of [{ isComposing: true }, { altKey: true }, { ctrlKey: true }, { metaKey: true }, { target: {} }, { defaultPrevented: true }]) {
			expect(f.key('ArrowRight', extra).stopped).toBe(false)
		}
		f.window.firstResponder = { window: f.window }; expect(f.key('ArrowRight').stopped).toBe(false)
		f.window.firstResponder = day; expect(f.key('Tab').prevented).toBe(false); expect(f.key('Escape').prevented).toBe(false)
		f.state.mode = 'range'; f.state.rangeAnchor = '2026-03-05'
		expect(f.key('Escape').stopped).toBe(true); expect(f.cancel).toHaveBeenCalledOnce(); expect(f.key('Escape').stopped).toBe(false)
		f.state.value = '2026-03-01'; f.key('Enter'); f.key(' ')
		expect(f.picked.mock.calls).toEqual([['2026-03-05'], ['2026-03-05']]); expect(f.state.value).toBe('2026-03-01')
	} finally { f.focus.dispose() }
})

it('repairs newly disabled focus and releases all day claims/observers while stale activation becomes inert', async () => {
	const f = fixture()
	await flush(); f.window.firstResponder = f.views.get('2026-03-05')
	f.state.isDisabled = (date: any) => date.day === 5; f.focus.update(); await flush()
	expect(f.window.firstResponder).toBe(f.views.get('2026-03-01'))
	f.state.isDisabled = () => true; f.focus.update(); await flush(); expect(f.claims.size).toBe(0)
	f.focus.dispose(); expect(f.observers.size).toBe(0); expect(f.claims.size).toBe(0)
	f.focus.activate('2026-03-01'); f.key('Enter'); expect(f.picked).not.toHaveBeenCalled()
})

it('unsupported bridges retain pointer selection and drop pending focus if the destination window changes', async () => {
	const old = fixture(false, false)
	try {
		await flush(); expect(old.claims.size).toBe(0); expect(old.observers.size).toBe(0)
		old.window.firstResponder = old.views.get('2026-03-05'); expect(old.key('ArrowRight').prevented).toBe(false)
		old.focus.activate('2026-03-05'); expect(old.picked).toHaveBeenCalledWith('2026-03-05')
	} finally { old.focus.dispose() }
	const f = fixture()
	try {
		await flush(); f.window.firstResponder = f.views.get('2026-03-31'); f.key('ArrowRight')
		const next: any = { firstResponder: null, recalculateKeyViewLoop() {}, makeFirstResponder: vi.fn(() => true) }
		f.root.window = next; f.state.months = [buildMonthGrid(2026, 4, 1)]; f.render(); await flush()
		expect(next.makeFirstResponder).not.toHaveBeenCalled()
	} finally { f.focus.dispose() }
})


it('hidden or detached calendars release day claims and cancel queued page focus before a later reveal', async () => {
	const f = fixture()
	try {
		await flush(); const old = f.views.get('2026-03-31'); f.window.firstResponder = old
		f.key('ArrowRight'); f.root.hidden = true; f.focus.update(); await flush()
		expect(f.claims.size).toBe(0)
		f.root.hidden = false; f.state.months = [buildMonthGrid(2026, 4, 1)]; f.render(); await flush()
		expect(f.window.firstResponder).toBe(old)
		f.root.window = null; for (const notify of f.observers.values()) {notify({ object: f.window })}
		expect(f.claims.size).toBe(0)
	} finally { f.focus.dispose() }
})
