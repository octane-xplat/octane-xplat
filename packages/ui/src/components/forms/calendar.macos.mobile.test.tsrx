/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Calendar } from './Calendar.macos.tsrx'
afterEach(() => vi.unstubAllGlobals())
function mount(props: any) {
	const claims = new Set<object>(), observers = new Set<object>()
	vi.stubGlobal('__xplatAppKit', { keyboardEventsSupported: true, suppressTabStop(view: object) { claims.add(view); return () => claims.delete(view) } })
	vi.stubGlobal('NSNotificationCenter', { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock() { const token = {}; observers.add(token); return token }, removeObserver(token: object) { observers.delete(token) },
	} })
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const panel = () => all().find((node) => node.props?.id === 'calendar')
	const days = () => all().filter((node) => node.type === 'masonview' && String(node.props?.className).split(' ').includes('vx-calendar-day'))
	const day = (n: number) => days().find((node) => node.children?.some((child: any) => child.props?.text === String(n)))
	const window: any = { firstResponder: null, recalculateKeyViewLoop() {}, makeFirstResponder(view: any) {
		if (view.window !== this || !view.isAccessibilityEnabled()) return false
		this.firstResponder = view; return true
	} }
	const hydrate = (node: any) => {
		node.window = window; node.bounds = {}; node.hidden = false; node.scrollRectToVisible = () => {}
		node.isAccessibilityEnabled = () => !node.props?.accessibilityState?.disabled
		node.subviews = { get count() { return node.children?.length ?? 0 }, objectAtIndex: (i: number) => node.children[i] }
		for (const child of node.children ?? []) { child.superview = node; hydrate(child) }
	}
	const render = (next: any) => { root.render(Calendar, { id: 'calendar', ...next }); flushUniversalSync(() => {}); hydrate(panel()) }
	const key = (value: string) => { let prevented = false; panel().props.onKeyDown({ key: value, target: window.firstResponder,
		preventDefault: () => { prevented = true }, stopPropagation() {} }); return prevented }
	render(props)
	return { root, render, panel, day, days, claims, observers, window, key }
}
it('Calendar day refs retain one native Tab candidate and wire keyboard selection without duplicating activation', async () => {
	const changed = vi.fn(), env = mount({ defaultValue: '2026-03-05', focusDate: '2026-03-01', onChange: changed })
	try {
		await vi.waitFor(() => expect(env.claims.size).toBe(30))
		env.window.firstResponder = env.day(5); expect(env.key('ArrowRight')).toBe(true)
		expect(env.window.firstResponder).toBe(env.day(6)); expect(changed).not.toHaveBeenCalled()
		expect(env.key('Enter')).toBe(true); flushUniversalSync(() => {})
		expect(changed).toHaveBeenCalledTimes(1); expect(changed.mock.calls[0][0]).toBe('2026-03-06')
		expect(env.day(6).props.accessibilityState.selected).toBe(true)
	} finally { env.root.unmount() }
	expect(env.claims.size).toBe(0); expect(env.observers.size).toBe(0)
})
it('Calendar keeps controlled month focus intent until parent acceptance and detached day handlers cannot select', async () => {
	const changed = vi.fn(), month = vi.fn(), base = { value: null, focusDate: '2026-03-01', onChange: changed, onFocusDateChange: month }
	const env = mount(base)
	try {
		await vi.waitFor(() => expect(env.claims.size).toBe(30)); const oldDay = env.day(31), cached = oldDay.props.onTap
		env.window.firstResponder = oldDay; expect(env.key('ArrowRight')).toBe(true)
		expect(month).toHaveBeenCalledWith('2026-04-01'); expect(env.window.firstResponder).toBe(oldDay)
		env.render({ ...base, focusDate: '2026-04-01' })
		await vi.waitFor(() => expect(env.window.firstResponder).toBe(env.day(1)))
		expect(changed).not.toHaveBeenCalled()
		env.root.unmount(); cached(); expect(changed).not.toHaveBeenCalled()
	} finally { env.root.unmount() }
})
