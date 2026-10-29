/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { openUrl } from '@octane-xplat/platform'
import { Button } from './Button.macos.tsrx'
import { IconButton } from './IconButton.macos.tsrx'
import { ButtonGroupProvider } from './button-group-context'

vi.mock('@octane-xplat/platform', async (original) => ({ ...await original<typeof import('@octane-xplat/platform')>(), openUrl: vi.fn() }))

function mount(component: any, props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(component, next); flushUniversalSync(() => {}) }
	const all = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	render(props)
	return { root, render, all, host: () => all().find((node) => node.props?.accessibilityRole === 'button') }
}
function deferred() {
	let resolve!: () => void, reject!: (error: unknown) => void
	const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no })
	return { promise, resolve, reject }
}

it('opens sanitized href before the action and blocks unsafe schemes and disabled links', () => {
	vi.mocked(openUrl).mockClear()
	const order: string[] = []
	vi.mocked(openUrl).mockImplementation((url) => { order.push(url); return true })
	const action = () => { order.push('action') }
	const env = mount(Button, { label: 'Docs', href: ' https://example.com/\nhelp ', clickAction: action })
	try {
		env.host().props.onTap()
		expect(order).toEqual(['https://example.com/help', 'action'])
		env.render({ label: 'Blocked', href: 'JaVaScRiPt:alert(1)', clickAction: action })
		env.host().props.onTap()
		expect(order).toEqual(['https://example.com/help', 'action', 'action'])
		env.render({ label: 'Disabled', href: 'https://example.com', isDisabled: true, clickAction: action })
		expect(env.host().props.onTap).toBeUndefined()
		expect(openUrl).toHaveBeenCalledTimes(1)
	} finally { env.root.unmount() }
})

it('retains content and host while busy, reports busy/name and rejects same-frame duplicates', async () => {
	const task = deferred(), action = vi.fn(() => task.promise)
	const env = mount(Button, { label: 'Save changes', clickAction: action, row: 2, style: { width: 180 }, onPressIn: vi.fn() })
	try {
		const host = env.host(), press = host.props.onTap
		const label = env.all().find((node) => node.props?.text === 'Save changes')
		press(); press(); flushUniversalSync(() => {})
		expect(action).toHaveBeenCalledTimes(1)
		expect(env.host()).toBe(host)
		expect(env.all()).toContain(label)
		expect(host.props.accessibilityState).toMatchObject({ busy: true, disabled: true })
		expect(host.props.accessibilityLabel).toBe('Save changes')
		expect(String(host.props.style.width)).toContain('180')
		expect(host.props.style.gridRow).toBe('3 / span 1')
		expect(env.all().some((node) => String(node.props?.className).includes('vx-button-content--hidden'))).toBe(true)
		task.resolve()
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(host.props.accessibilityState.busy).toBeUndefined() })
		expect(env.all()).toContain(label)
		expect(host.props.onTap).toBeTypeOf('function')
	} finally { env.root.unmount() }
})

it('keeps interruptible overlap busy until every promise settles and reports errors', async () => {
	const first = deferred(), second = deferred(), error = new Error('save failed'), errors = vi.fn()
	let calls = 0
	const env = mount(Button, { label: 'Save', isInterruptible: true,
		clickAction: () => ++calls === 1 ? first.promise : second.promise, onActionError: errors })
	try {
		const press = env.host().props.onTap
		press(); press(); flushUniversalSync(() => {})
		expect(calls).toBe(2)
		first.resolve(); await Promise.resolve(); flushUniversalSync(() => {})
		expect(env.host().props.accessibilityState).toMatchObject({ busy: true, disabled: undefined })
		second.reject(error)
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(errors).toHaveBeenCalledWith(error) })
		expect(env.host().props.accessibilityState.busy).toBeUndefined()
	} finally { env.root.unmount() }
})

it('inherits group disablement, forwards press metadata and honors interruptible external loading', () => {
	const inside = vi.fn(), action = vi.fn()
	function Group() { return <ButtonGroupProvider value={{ position: 'only', isDisabled: true }}><Button label="Grouped" clickAction={action} /></ButtonGroupProvider> }
	const group = mount(Group, {})
	try { expect(group.host().props.onTap).toBeUndefined() } finally { group.root.unmount() }
	const env = mount(Button, { label: 'Retry', isLoading: true, isInterruptible: true, clickAction: action,
		onPressIn: inside, accessibilityHint: 'Saves the draft', accessibilityState: { selected: true } })
	try {
		const host = env.host()
		host.props.onTouch({ action: 'down' }); host.props.onTap()
		expect(inside).toHaveBeenCalledTimes(1)
		expect(action).toHaveBeenCalledTimes(1)
		expect(host.props.accessibilityHint).toBe('Saves the draft')
		expect(host.props.accessibilityState).toMatchObject({ selected: true, busy: true })
	} finally { env.root.unmount() }
})

it('reports synchronous errors and ignores cached presses after unmount', async () => {
	const error = new Error('failure'), errors = vi.fn(), task = deferred()
	const env = mount(Button, { label: 'Save', clickAction: () => { throw error }, onActionError: errors })
	env.host().props.onTap()
	expect(errors).toHaveBeenCalledWith(error)
	const action = vi.fn(() => task.promise)
	env.render({ label: 'Save', clickAction: action })
	const press = env.host().props.onTap
	press(); env.root.unmount(); press()
	task.resolve(); await Promise.resolve()
	expect(action).toHaveBeenCalledTimes(1)
})


it('wraps primitive children in text hosts and forwards refs without changing pending ownership', async () => {
	const task = deferred(), action = vi.fn(() => task.promise), ref = { current: null }
	function ChildButton(props: any) { return <Button {...props}>Save draft</Button> }
	const env = mount(ChildButton, { label: 'Fallback', clickAction: action, ref })
	try {
		const host = env.host(), press = host.props.onTap
		expect(ref.current).toBe(host)
		expect(env.all().some((node) => node.type === 'label' && String(node.props?.className).includes('vx-button-label'))).toBe(true)
		press(); flushUniversalSync(() => {})
		const nextRef = { current: null }
		env.render({ clickAction: action, ref: nextRef })
		press(); expect(action).toHaveBeenCalledTimes(1)
		expect(nextRef.current).toBe(host)
		task.resolve()
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(host.props.accessibilityState.busy).toBeUndefined() })
	} finally { env.root.unmount() }
})


it('IconButton shares named busy ownership and preserves icon/ref/metadata', async () => {
	const task = deferred(), action = vi.fn(() => task.promise), ref = { current: null }
	const env = mount(IconButton, { label: 'Share', icon: <label id="share-icon" text="Share glyph" />,
		clickAction: action, ref, testID: 'document.share', accessibilityHint: 'Shares this document' })
	try {
		const host = env.host(), press = host.props.onTap
		expect(ref.current).toBe(host)
		expect(host.props.accessibilityLabel).toBe('Share')
		expect(host.props.accessibilityHint).toBe('Shares this document')
		expect(host.props.testID).toBe('document.share')
		const icon = env.all().find((node) => node.props?.id === 'share-icon')
		press(); press(); flushUniversalSync(() => {})
		expect(action).toHaveBeenCalledTimes(1)
		expect(host.props.accessibilityState).toMatchObject({ busy: true, disabled: true })
		expect(env.all()).toContain(icon)
		task.resolve()
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(host.props.accessibilityState.busy).toBeUndefined() })
		expect(env.all()).toContain(icon)
	} finally { env.root.unmount() }
})

it('IconButton inherits group disablement and uses Button sanitized href dispatch', () => {
	vi.mocked(openUrl).mockClear()
	function Group() { return <ButtonGroupProvider value={{ position: 'only', isDisabled: true, size: 'sm' }}>
		<IconButton label="Share" icon={<label text="Share" />} href="https://example.com" />
	</ButtonGroupProvider> }
	const group = mount(Group, {})
	try {
		expect(group.host().props.onTap).toBeUndefined()
		expect(String(group.host().props.className)).toContain('vx-button--size-sm')
	} finally { group.root.unmount() }
	const env = mount(IconButton, { label: 'Help', icon: <label text="Help" />, href: ' https://example.com/help ' })
	try { env.host().props.onTap(); expect(openUrl).toHaveBeenCalledWith('https://example.com/help') }
	finally { env.root.unmount() }
})


it('held AppKit presses use current props, inherited blocking, href and callback', () => {
	const events: string[] = []
	vi.mocked(openUrl).mockReset().mockImplementation((url) => { events.push(url); return true })
	function Grouped(props: any) {
		const { group, ...button } = props
		return <ButtonGroupProvider value={{ position: 'only', isDisabled: group }}><Button {...button} /></ButtonGroupProvider>
	}
	const base = { label: 'Save', href: 'https://example.com/old', clickAction: () => events.push('old') }
	const env = mount(Grouped, base)
	try {
		const press = env.host().props.onTap
		for (const state of [{ isDisabled: true }, { group: true }, { isLoading: true }]) { env.render({ ...base, ...state }); press() }
		expect(events).toEqual([])
		env.render({ label: 'Current', href: ' https://example.com/new ', clickAction: () => events.push('current') })
		press(); expect(events).toEqual(['https://example.com/new', 'current'])
	} finally { env.root.unmount(); vi.mocked(openUrl).mockReset() }
})

it('held presses use current interruptibility and active tokens rather than rendered pending state', async () => {
	const tasks = [deferred(), deferred(), deferred()]
	let calls = 0
	const action = () => tasks[calls++].promise
	const env = mount(Button, { label: 'Save', isInterruptible: true, clickAction: action })
	try {
		const press = env.host().props.onTap
		press(); press(); expect(calls).toBe(2)
		env.render({ label: 'Save', isInterruptible: false, clickAction: action })
		press(); expect(calls).toBe(2)
		tasks[0].resolve(); await Promise.resolve(); press(); expect(calls).toBe(2)
		tasks[1].resolve(); await Promise.resolve()
		// No renderer flush: the rendered busy state may still describe the old call.
		press(); expect(calls).toBe(3)
		tasks[2].resolve(); await Promise.resolve(); flushUniversalSync(() => {})
		expect(env.host().props.accessibilityState.busy).toBeUndefined()
	} finally { tasks.forEach((task) => task.resolve()); env.root.unmount() }
})

it('noninterruptible Button ownership is claimed before URL bridge reentry', () => {
	const events: string[] = []
	let press = () => {}, entered = false
	vi.mocked(openUrl).mockReset().mockImplementation(() => {
		events.push('url'); if (!entered) { entered = true; press() }; return true
	})
	const env = mount(Button, { label: 'Help', href: 'https://example.com/help', clickAction: () => events.push('action') })
	try { press = env.host().props.onTap; press(); expect(events).toEqual(['url', 'action']) }
	finally { env.root.unmount(); vi.mocked(openUrl).mockReset() }
})

it('an accepted URL/action pair retains its callback and error owner across prop/ref replacement', () => {
	const events: string[] = [], failure = new Error('accepted action')
	let replace = () => {}, press = () => {}
	vi.mocked(openUrl).mockReset().mockImplementation(() => { replace(); press(); return true })
	const env = mount(Button, { label: 'Help', href: 'https://example.com/old',
		clickAction: () => { events.push('accepted'); throw failure }, onActionError: (error: unknown) => { expect(error).toBe(failure); events.push('accepted-error') } })
	try {
		press = env.host().props.onTap
		const nextRef = { current: null }, nestedRef = { current: null }
		replace = () => env.render({ label: 'New', ref: [nextRef, [nestedRef]], href: 'https://example.com/new',
			clickAction: () => events.push('current'), onActionError: () => events.push('current-error') })
		press(); expect(events).toEqual(['accepted', 'accepted-error']); expect(nextRef.current).toBe(env.host()); expect(nestedRef.current).toBe(env.host())
		vi.mocked(openUrl).mockReturnValue(true); press()
		expect(openUrl).toHaveBeenLastCalledWith('https://example.com/new')
		expect(events).toEqual(['accepted', 'accepted-error', 'current'])
	} finally { env.root.unmount(); vi.mocked(openUrl).mockReset() }
})

it('a synchronous URL opener error releases the claim and skips the action without changing its error channel', () => {
	const failure = new Error('URL bridge'), action = vi.fn(), errors = vi.fn()
	vi.mocked(openUrl).mockReset().mockImplementation(() => { throw failure })
	const env = mount(Button, { label: 'Help', href: 'https://example.com/help', clickAction: action, onActionError: errors })
	try {
		const press = env.host().props.onTap
		expect(() => press()).toThrow(failure); expect(action).not.toHaveBeenCalled(); expect(errors).not.toHaveBeenCalled()
		vi.mocked(openUrl).mockReturnValue(true); press(); expect(action).toHaveBeenCalledOnce()
	} finally { env.root.unmount(); vi.mocked(openUrl).mockReset() }
})

it('throwing action then access reports to the accepted error owner and releases the token', () => {
	const failure = new Error('then getter'), errors = vi.fn()
	let press = () => {}, malformed = true, calls = 0
	const value = Object.defineProperty({}, 'then', { get() { press(); throw failure } })
	const env = mount(Button, { label: 'Save', clickAction: () => { calls++; return malformed ? value : undefined }, onActionError: errors })
	try {
		press = env.host().props.onTap; press()
		expect(calls).toBe(1); expect(errors).toHaveBeenCalledTimes(1); expect(errors).toHaveBeenCalledWith(failure)
		malformed = false; press(); expect(calls).toBe(2)
	} finally { env.root.unmount() }
})

it('pending Button failure keeps its accepted error callback after replacement and teardown', async () => {
	const task = deferred(), failure = new Error('save failed'), accepted = vi.fn(), replacement = vi.fn(), action = vi.fn(() => task.promise)
	const ref = { current: null }
	const env = mount(Button, { label: 'Save', clickAction: action, onActionError: accepted, ref })
	try {
		const press = env.host().props.onTap
		press(); env.render({ label: 'Changed', clickAction: action, onActionError: replacement, ref })
		env.root.unmount(); expect(ref.current).toBeNull(); press()
		task.reject(failure); await Promise.resolve(); flushUniversalSync(() => {})
		expect(action).toHaveBeenCalledOnce(); expect(accepted).toHaveBeenCalledTimes(1); expect(accepted).toHaveBeenCalledWith(failure)
		expect(replacement).not.toHaveBeenCalled()
	} finally { env.root.unmount() }
})

it('IconButton held actions inherit current Button loading, href and action ownership', () => {
	const events: string[] = []
	vi.mocked(openUrl).mockReset().mockImplementation((url) => { events.push(url); return true })
	const base = { label: 'Help', icon: <label text="Help" />, href: 'https://example.com/old', clickAction: () => events.push('old') }
	const env = mount(IconButton, base)
	try {
		const press = env.host().props.onTap
		env.render({ ...base, isLoading: true }); press(); expect(events).toEqual([])
		env.render({ ...base, href: 'https://example.com/current', clickAction: () => events.push('current') })
		press(); expect(events).toEqual(['https://example.com/current', 'current'])
	} finally { env.root.unmount(); vi.mocked(openUrl).mockReset() }
})
