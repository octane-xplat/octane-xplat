/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { DateTimeInput } from './DateTimeInput.macos.tsrx'
const popup = vi.hoisted(() => ({ byClass: new Map<string, any>() }))
vi.mock('../overlays/Popover.macos.tsrx', () => ({ Popover: (props: any) => { popup.byClass.set(props.className, props); return props.open ? <masonview>{props.children}</masonview> : null } }))
afterEach(() => vi.unstubAllGlobals())
function mount(extra: any = {}) {
	const claims = new Set<object>(), observers = new Set<object>()
	vi.stubGlobal('__xplatAppKit', { keyboardEventsSupported: true, suppressTabStop(view: object) { claims.add(view); return () => claims.delete(view) } })
	vi.stubGlobal('NSNotificationCenter', { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock() { const token = {}; observers.add(token); return token }, removeObserver(token: object) { observers.delete(token) },
	} })
	const window = () => ({ firstResponder: null as any, recalculateKeyViewLoop() {}, makeFirstResponder(view: any) {
		if (view.window !== this || !view.isAccessibilityEnabled()) return false
		this.firstResponder = view; return true
	} })
	const main = window(), panel = window(), container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const has = (node: any, name: string) => String(node.props?.className).split(' ').includes(name)
	const one = (name: string) => all().find((node) => has(node, name))
	const rows = () => all().filter((node) => has(node, 'vx-datetimeinput-timeoption'))
	const input = () => all().find((node) => node.props?.id === 'appointment-time')
	const hydrate = (node: any, owner = main) => {
		if (has(node, 'vx-datetimeinput-timelist')) owner = panel
		node.window = owner; node.bounds = {}; node.hidden = false; node.scrollRectToVisible = () => {}
		node.isAccessibilityEnabled = () => !node.props?.accessibilityState?.disabled
		node.subviews = { get count() { return node.children?.length ?? 0 }, objectAtIndex: (i: number) => node.children[i] }
		for (const child of node.children ?? []) { child.superview = node; hydrate(child, owner) }
	}
	const flush = () => { flushUniversalSync(() => {}); for (const node of container.children) hydrate(node) }
	const base = { id: 'appointment', value: '2026-03-05T09:15', min: '2026-03-05T09:00', max: '2026-03-05T10:00', timeOptionInterval: 15, ...extra }
	const render = (props: any) => { root.render(DateTimeInput, props); flush() }
	const key = (view: any, key: string, extra = {}) => { let prevented = false; view.props.onKeyDown({ key, target: view === input() ? view : panel.firstResponder,
		preventDefault: () => { prevented = true }, stopPropagation() {}, ...extra }); flush(); return prevented }
	render(base)
	return { root, all, one, rows, input, main, panel, claims, observers, base, render, flush, key,
		popup: () => popup.byClass.get('vx-datetimeinput-times') }
}
it('Alt-Down opens bounded preset rows, navigation does not emit, and Enter selects once with input return intent', async () => {
	const changed = vi.fn(), env = mount({ onChange: changed })
	try {
		expect(env.key(env.input(), 'ArrowDown', { altKey: true })).toBe(true)
		await vi.waitFor(() => { env.flush(); expect(env.panel.firstResponder).toBe(env.rows()[1]) })
		expect(env.rows()).toHaveLength(5); expect(changed).not.toHaveBeenCalled()
		env.key(env.one('vx-timelist--appkit'), 'ArrowDown'); expect(env.panel.firstResponder).toBe(env.rows()[2])
		expect(changed).not.toHaveBeenCalled()
		env.key(env.one('vx-timelist--appkit'), 'Enter')
		expect(changed).toHaveBeenCalledTimes(1); expect(changed).toHaveBeenCalledWith('2026-03-05T09:30')
		expect(env.popup().finalFocusRef.current).toBe(env.input()); expect(env.rows()).toHaveLength(0)
	} finally { env.root.unmount() }
	expect(env.claims.size).toBe(0); expect(env.observers.size).toBe(0)
})
it('Tab records current field neighbors without selecting and ordinary dismissal restores the field intent', async () => {
	const changed = vi.fn(), env = mount({ onChange: changed })
	try {
		const previous = { window: env.main }, next = { window: env.main }
		env.input().previousValidKeyView = previous; env.input().nextValidKeyView = next
		env.key(env.input(), 'ArrowDown', { altKey: true }); await vi.waitFor(() => { env.flush(); expect(env.panel.firstResponder).toBe(env.rows()[1]) })
		expect(env.key(env.one('vx-timelist--appkit'), 'Tab', { shiftKey: true })).toBe(true)
		expect(env.popup().finalFocusRef.current).toBe(previous); expect(changed).not.toHaveBeenCalled()
		env.key(env.input(), 'ArrowDown', { altKey: true }); await vi.waitFor(() => { env.flush(); expect(env.rows()).toHaveLength(5) })
		env.popup().onDismiss(); env.flush(); expect(env.popup().finalFocusRef.current).toBe(env.input())
	} finally { env.root.unmount() }
})
it('selection reentry cannot duplicate saves and cached callbacks cannot reopen blocked or empty controls', async () => {
	let repeat = () => {}, flushParent = () => {}, calls = 0
	const changed = vi.fn(() => { if (++calls === 1) { flushParent(); repeat() } }), saved = vi.fn(), env = mount({ onChange: changed, changeAction: saved })
	flushParent = () => env.render({ ...env.base, label: 'Updated during selection' })
	try {
		const clock = env.one('vx-datetimeinput-timestoggle').props.onTap
		env.key(env.input(), 'ArrowDown', { altKey: true }); await vi.waitFor(() => { env.flush(); expect(env.rows()).toHaveLength(5) })
		repeat = env.rows()[2].props.onTap; repeat(); env.flush()
		expect(changed).toHaveBeenCalledTimes(1); expect(saved).toHaveBeenCalledTimes(1)
		await vi.waitFor(() => { env.flush(); expect(env.input().props.isEnabled).toBe(true) })
		env.render({ ...env.base, isReadOnly: true }); clock(); env.flush(); expect(env.rows()).toHaveLength(0)
		env.render({ ...env.base, timeOptionInterval: undefined }); clock(); env.flush(); expect(env.rows()).toHaveLength(0)
	} finally { env.root.unmount() }
})
it('opening guards preserve composition, modifiers, foreign targets and detached handlers', () => {
	const env = mount()
	try {
		const field = env.input(), cached = field.props.onKeyDown
		for (const extra of [{ isComposing: true }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { defaultPrevented: true }, { target: {} }]) {
			expect(env.key(field, 'ArrowDown', { altKey: true, ...extra })).toBe(false); expect(env.rows()).toHaveLength(0)
		}
		env.root.unmount(); let prevented = false
		cached({ key: 'ArrowDown', altKey: true, target: field, preventDefault: () => { prevented = true }, stopPropagation() {} })
		expect(prevented).toBe(false)
	} finally { env.root.unmount() }
})


it('time-only selection retains a draft until a valid date is entered', async () => {
	const changed = vi.fn(), env = mount({ value: null, onChange: changed, hourFormat: '24h' })
	try {
		env.key(env.input(), 'ArrowDown', { altKey: true })
		await vi.waitFor(() => { env.flush(); expect(env.rows()).toHaveLength(96) })
		env.rows()[38].props.onTap(); env.flush() // 09:30, without a selected date yet.
		expect(changed).not.toHaveBeenCalled(); expect(env.input().props.value).toContain('9:30')
		const date = env.all().find((node) => node.props?.id === 'appointment')
		date.props.onTextChange('2026-03-05'); env.flush()
		expect(changed).toHaveBeenCalledWith('2026-03-05T09:30')
	} finally { env.root.unmount() }
})

it('closed time fields step exact values independently of preset cadence and honor current endpoint bounds', () => {
	const changed = vi.fn(), env = mount({ value: '2026-03-05T09:15:17', hasSeconds: true, timeIncrement: 5, onChange: changed })
	try {
		const handler = env.input().props.onKeyDown
		expect(env.key(env.input(), 'ArrowUp')).toBe(true); expect(changed).toHaveBeenLastCalledWith('2026-03-05T09:20:17')
		expect(env.rows()).toHaveLength(0); expect(env.input().props.value).toContain('9:15:17')
		env.render({ ...env.base, value: '2026-03-05T09:20:17', timeIncrement: 10 })
		handler({ key: 'ArrowDown', target: env.input(), preventDefault() {}, stopPropagation() {} }); env.flush()
		expect(changed).toHaveBeenLastCalledWith('2026-03-05T09:10:17')
		changed.mockClear(); env.render({ ...env.base, value: '2026-03-05T09:00:00' })
		expect(env.key(env.input(), 'ArrowDown')).toBe(true); expect(changed).not.toHaveBeenCalled()
		env.render({ ...env.base, value: '2026-03-05T10:00:00' }); env.key(env.input(), 'ArrowUp'); expect(changed).not.toHaveBeenCalled()
		env.render({ ...env.base, value: '2026-03-05T23:55:17', min: undefined, max: undefined, timeIncrement: 10 })
		env.key(env.input(), 'ArrowUp'); expect(changed).toHaveBeenLastCalledWith('2026-03-05T00:05:17')
	} finally { env.root.unmount() }
})
it('closed-field stepping retains date-less time drafts and preserves popup/modified/marked-editor ownership', async () => {
	const changed = vi.fn(), env = mount({ value: null, timeIncrement: 15, hourFormat: '24h', onChange: changed })
	try {
		env.input().props.onTextChange('09:15'); env.flush()
		env.key(env.input(), 'ArrowUp'); expect(env.input().props.value).toContain('9:30'); expect(changed).not.toHaveBeenCalled()
		env.key(env.input(), 'ArrowDown'); expect(env.input().props.value).toContain('9:15')
		for (const extra of [{ altKey: true }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { isComposing: true }, { defaultPrevented: true }, { target: {} }]) {
			expect(env.key(env.input(), 'ArrowUp', extra)).toBe(false)
		}
		env.input().currentEditor = () => ({ hasMarkedText: true }); expect(env.key(env.input(), 'ArrowUp')).toBe(false)
		env.input().currentEditor = null
		env.key(env.input(), 'ArrowDown', { altKey: true }); await vi.waitFor(() => { env.flush(); expect(env.rows()).toHaveLength(96) })
		expect(env.key(env.input(), 'ArrowUp')).toBe(false); expect(changed).not.toHaveBeenCalled()
		env.popup().onDismiss(); env.flush()
		const date = env.all().find((node) => node.props?.id === 'appointment')
		date.props.onTextChange('2026-03-05'); env.flush(); expect(changed).toHaveBeenLastCalledWith('2026-03-05T09:15')
	} finally { env.root.unmount() }
})
it('step callback reentry and pending saves exclude duplicate writes and release after failure', async () => {
	let repeat = () => {}, reject!: (error: Error) => void, count = 0
	const changed = vi.fn(() => { if (++count === 1) repeat() }), save = vi.fn(() => new Promise<void>((_, fail) => { reject = fail }))
	const env = mount({ timeIncrement: 5, onChange: changed, changeAction: save })
	try {
		const handler = env.input().props.onKeyDown
		repeat = () => { env.render({ ...env.base, label: 'Reentered' }); handler({ key: 'ArrowUp', target: env.input(), preventDefault() {}, stopPropagation() {} }) }
		env.key(env.input(), 'ArrowUp'); expect(changed).toHaveBeenCalledTimes(1); expect(save).toHaveBeenCalledTimes(1)
		expect(env.key(env.input(), 'ArrowUp')).toBe(false); expect(env.key(env.input(), 'ArrowDown', { altKey: true })).toBe(false)
		reject(Error('offline')); await vi.waitFor(() => { env.flush(); expect(env.input().props.editable).toBe(true) })
		env.render({ ...env.base, value: '2026-03-05T09:20', changeAction: () => { throw Error('offline') } })
		env.key(env.input(), 'ArrowDown'); await vi.waitFor(() => { env.flush(); expect(env.input().props.editable).toBe(true) })
		expect(changed).toHaveBeenLastCalledWith('2026-03-05T09:15'); expect(env.input().props.value).toContain('9:20')
	} finally { env.root.unmount() }
})
it('a step releases throwing forward callbacks and dispatches an accepted save after teardown without detached state writes', async () => {
	const env = mount({ timeIncrement: 5, onChange: () => { throw Error('forward') } })
	try {
		expect(() => env.key(env.input(), 'ArrowUp')).toThrow('forward')
		const changed = vi.fn(); env.render({ ...env.base, onChange: changed }); env.key(env.input(), 'ArrowUp'); expect(changed).toHaveBeenCalledTimes(1)
		let settle!: () => void
		const save = vi.fn(() => new Promise<void>((done) => { settle = done }))
		env.render({ ...env.base, onChange: () => env.root.unmount(), changeAction: save })
		env.key(env.input(), 'ArrowDown'); expect(save).toHaveBeenCalledWith('2026-03-05T09:10'); settle(); await Promise.resolve(); env.flush()
	} finally { env.root.unmount() }
})
