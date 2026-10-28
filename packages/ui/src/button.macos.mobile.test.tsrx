/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { openUrl } from '@octane-xplat/platform'
import { Button } from './Button.macos.tsrx'
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
	const env = mount(Button, { label: 'Save changes', clickAction: action, width: 180, onPressIn: vi.fn() })
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
