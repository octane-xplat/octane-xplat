/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { TabList, Tab, TabMenu } from './TabList.macos.tsrx'
const popup = vi.hoisted(() => ({ current: null as any }))
vi.mock('./Popover.macos.tsrx', () => ({ Popover: (props: any) => { popup.current = props; return props.open ? <masonview>{props.children}</masonview> : null } }))
afterEach(() => vi.unstubAllGlobals())
function mount(extra: any = {}, supported = true) {
	const keys = new Map<any, any>(), claims = new Set<any>(), retained = new Set<any>(), observers = new Map<any, any>()
	vi.stubGlobal('__xplatAppKit', { keyboardEventsSupported: supported,
		observeViewKeys(view: any, callbacks: any) { keys.set(view, callbacks); return () => keys.delete(view) },
		suppressTabStop(view: any) { claims.add(view); return () => claims.delete(view) },
		retainFocusTarget(view: any) { retained.add(view); return () => retained.delete(view) },
	})
	vi.stubGlobal('NSNotificationCenter', { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock(_: any, __: any, ___: any, callback: any) { const token = {}; observers.set(token, callback); return token },
		removeObserver(token: any) { observers.delete(token) },
	} })
	const makeWindow = () => ({ firstResponder: null as any, recalculateKeyViewLoop() {}, makeFirstResponder(view: any) {
		if (view && (view.window !== this || !view.isAccessibilityEnabled())) return false
		this.firstResponder = view; return true
	} })
	const main = makeWindow(), panel = makeWindow(), container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	function Fixture(props: any) {
		return <TabList id="tabs" role="tablist" layout="fill" value={props.value} onChange={props.onChange}>
			<Tab id="overview" value="overview" label="Overview" />
			<TabMenu id="more" label={props.label ?? 'More'} options={props.options} />
		</TabList>
	}
	const base = { value: 'overview', options: [{ value: 'settings', label: 'Settings' }, { value: 'support', label: 'Support' }], onChange: vi.fn(), ...extra }
	const has = (node: any, cls: string) => String(node.props?.className).split(' ').includes(cls)
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const one = (id: string) => all().find((node) => node.props?.id === id)
	const menu = () => all().find((node) => has(node, 'vx-tabmenu'))
	const rows = () => all().filter((node) => has(node, 'vx-tabmenu-item'))
	const hydrate = (node: any, window = main) => {
		if (has(node, 'vx-tabmenu')) window = panel
		node.window = window; node.hidden = false; node.bounds = {}; node.scrollRectToVisible = () => {}
		node.isAccessibilityEnabled = () => !node.props?.disabled && !node.props?.accessibilityState?.disabled
		node.subviews = { get count() { return node.children?.length ?? 0 }, objectAtIndex: (i: number) => node.children[i] }
		for (const child of node.children ?? []) { child.superview = node; hydrate(child, window) }
	}
	const flush = () => { flushUniversalSync(() => {}); for (const node of container.children) hydrate(node) }
	const render = (next: any) => { root.render(Fixture, next); flush() }
	const notify = (window: any) => { for (const observer of observers.values()) observer({ object: window }); flush() }
	const key = (view: any, name: string, extra: any = {}) => {
		let prevented = false, stopped = false
		const event = { key: name, target: view === one('more') ? view : panel.firstResponder,
			preventDefault: () => { prevented = true }, stopPropagation: () => { stopped = true }, ...extra }
		if (view === one('more')) keys.get(view)?.onKeyDown(event); else view.props.onKeyDown(event)
		flush(); return { prevented, stopped }
	}
	render(base)
	return { root, base, render, one, menu, rows, key, flush, notify, main, panel, claims, retained, keys, observers, popup: () => popup.current }
}
it('registers the selected overflow trigger with strip roving focus and releases trigger/menu ownership on teardown', () => {
	const env = mount({ value: 'settings' })
	try {
		env.notify(env.main); expect(env.claims.has(env.one('overview'))).toBe(true); expect(env.claims.has(env.one('more'))).toBe(false)
		env.main.firstResponder = env.one('more')
		env.one('tabs').props.onKeyDown({ key: 'ArrowLeft', preventDefault() {}, stopPropagation() {} })
		expect(env.main.firstResponder).toBe(env.one('overview')); expect(env.base.onChange).not.toHaveBeenCalled()
	} finally { env.root.unmount() }
	expect(env.claims.size).toBe(0); expect(env.keys.size).toBe(0); expect(env.retained.size).toBe(0); expect(env.observers.size).toBe(0)
})
it('Down/Up opens first/last options, menu navigation and prefix focus remain manual, and Enter selects once', async () => {
	const env = mount()
	try {
		expect(env.key(env.one('more'), 'ArrowUp')).toEqual({ prevented: true, stopped: true })
		await vi.waitFor(() => { env.flush(); expect(env.panel.firstResponder).toBe(env.rows()[1]) })
		env.key(env.menu(), 'Home'); expect(env.panel.firstResponder).toBe(env.rows()[0])
		env.key(env.menu(), 'ArrowUp'); expect(env.panel.firstResponder).toBe(env.rows()[1])
		env.key(env.menu(), 's'); expect(env.base.onChange).not.toHaveBeenCalled()
		env.key(env.menu(), 'Enter'); expect(env.base.onChange).toHaveBeenCalledTimes(1)
		expect(env.popup().open).toBe(false); expect(env.popup().finalFocusRef.current).toBe(env.one('more'))
	} finally { env.root.unmount() }
})
it('Tab records current strip-neighbor intent and ordinary Escape remains owned by the layer', async () => {
	const env = mount()
	try {
		const previous = { window: env.main }; env.one('more').previousValidKeyView = previous
		env.key(env.one('more'), 'ArrowDown'); await vi.waitFor(() => { env.flush(); expect(env.panel.firstResponder).toBe(env.rows()[0]) })
		expect(env.key(env.menu(), 'Escape').prevented).toBe(false)
		expect(env.key(env.menu(), 'Tab', { shiftKey: true }).prevented).toBe(true)
		expect(env.popup().finalFocusRef.current).toBe(previous); expect(env.base.onChange).not.toHaveBeenCalled()
		env.one('more').props.onTap(); env.flush(); env.popup().onDismiss(); env.flush()
		expect(env.popup().finalFocusRef.current).toBe(env.one('more'))
	} finally { env.root.unmount() }
})
it('rejects duplicate selection during parent flush, stale removed rows and empty/detached entry', async () => {
	let repeat = () => {}, count = 0
	const changed = vi.fn(() => { if (++count === 1) repeat() }), env = mount({ onChange: changed })
	try {
		const trigger = env.one('more'), toggle = trigger.props.onTap
		env.key(trigger, 'ArrowDown'); await vi.waitFor(() => { env.flush(); expect(env.rows()).toHaveLength(2) })
		const pick = env.rows()[0].props.onTap
		repeat = () => { env.render({ ...env.base, value: 'settings' }); pick(); toggle() }
		pick(); env.flush(); expect(changed).toHaveBeenCalledTimes(1); expect(env.one('more')).toBe(trigger); expect(env.popup().open).toBe(false)
		toggle(); env.flush(); const removed = env.rows()[1].props.onTap
		env.render({ ...env.base, options: [env.base.options[0]] }); removed(); expect(changed).toHaveBeenCalledTimes(1)
		env.render({ ...env.base, options: [] }); toggle(); env.flush(); expect(env.popup().open).toBe(false)
		env.root.unmount(); toggle(); pick(); expect(changed).toHaveBeenCalledTimes(1)
	} finally { env.root.unmount() }
})
it('preserves modified/composing/prevented/descendant trigger input without opening', () => {
	const env = mount()
	try {
		for (const extra of [{ altKey: true }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { isComposing: true }, { defaultPrevented: true }, { target: {} }]) {
			expect(env.key(env.one('more'), 'ArrowDown', extra).prevented).toBe(false); expect(env.popup().open).toBe(false)
		}
	} finally { env.root.unmount() }
})
it('older keyboard bridges retain pointer selection without a trigger key lease', () => {
	const env = mount({}, false)
	try {
		expect(env.keys.size).toBe(0); env.one('more').props.onTap(); env.flush()
		env.rows()[0].props.onTap(); env.flush(); expect(env.base.onChange).toHaveBeenCalledWith('settings'); expect(env.popup().open).toBe(false)
	} finally { env.root.unmount() }
})

it('a nonempty overflow menu repairs removal of its focused option without selecting or reopening', async () => {
	const env = mount()
	try {
		env.key(env.one('more'), 'ArrowUp'); await vi.waitFor(() => { env.flush(); expect(env.panel.firstResponder).toBe(env.rows()[1]) })
		env.render({ ...env.base, options: [env.base.options[0]] })
		await vi.waitFor(() => { env.flush(); expect(env.panel.firstResponder).toBe(env.rows()[0]) })
		expect(env.popup().open).toBe(true); expect(env.base.onChange).not.toHaveBeenCalled()
	} finally { env.root.unmount() }
})
