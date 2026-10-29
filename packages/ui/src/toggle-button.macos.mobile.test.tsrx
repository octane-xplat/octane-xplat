/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { ToggleButton, ToggleButtonGroup } from './ToggleButton.macos.tsrx'
import { openUrl } from '@octane-xplat/platform'

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
	return { root, render, all, buttons: () => all().filter((node) => node.props?.accessibilityRole === 'button') }
}
function deferred() {
	let resolve!: () => void, reject!: (error: unknown) => void
	const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no })
	return { promise, resolve, reject }
}

it('toggles optimistically before the save action, reports busy and rejects same-frame duplicates', async () => {
	const task = deferred(), events: unknown[] = []
	const env = mount(ToggleButton, { label: 'Pin', testID: 'pin',
		onPressedChange: (value: boolean) => events.push(['change', value]),
		pressedChangeAction: (value: boolean) => { events.push(['save', value]); return task.promise } })
	try {
		const host = env.buttons()[0], press = host.props.onTap
		press(); press(); flushUniversalSync(() => {})
		expect(events).toEqual([['change', true], ['save', true]])
		expect(env.buttons()[0]).toBe(host)
		expect(host.props.accessibilityState).toMatchObject({ pressed: true, busy: true, disabled: true })
		expect(host.props.testID).toBe('pin')
		expect(env.all().some((node) => String(node.props?.className).includes('vx-button-spinner'))).toBe(true)
		task.resolve()
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(host.props.accessibilityState.busy).toBeUndefined() })
		expect(host.props.accessibilityState.pressed).toBe(true)
	} finally { env.root.unmount() }
})

it('controlled display follows the parent and errors preserve the optimistic uncontrolled choice', async () => {
	const error = new Error('save failed'), errors = vi.fn(), changes = vi.fn(), action = vi.fn()
	const env = mount(ToggleButton, { label: 'Pin', isPressed: false, onPressedChange: changes, pressedChangeAction: action })
	try {
		env.buttons()[0].props.onTap(); flushUniversalSync(() => {})
		expect(changes).toHaveBeenCalledWith(true)
		expect(action).toHaveBeenCalledWith(true)
		expect(env.buttons()[0].props.accessibilityState.pressed).toBe(false)
		env.render({ label: 'Pin', isPressed: true })
		expect(env.buttons()[0].props.accessibilityState.pressed).toBe(true)
	} finally { env.root.unmount() }
	const task = deferred()
	const uncontrolled = mount(ToggleButton, { label: 'Pin', onActionError: errors, pressedChangeAction: () => task.promise })
	try {
		uncontrolled.buttons()[0].props.onTap(); flushUniversalSync(() => {})
		task.reject(error)
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(errors).toHaveBeenCalledWith(error) })
		expect(uncontrolled.buttons()[0].props.accessibilityState).toMatchObject({ pressed: true, busy: undefined })
	} finally { uncontrolled.root.unmount() }
})

it('interruptible same-frame flips use current uncontrolled state and retain busy ownership', async () => {
	const first = deferred(), second = deferred(), values: boolean[] = []
	const env = mount(ToggleButton, { label: 'Pin', isInterruptible: true,
		pressedChangeAction: (value: boolean) => { values.push(value); return values.length === 1 ? first.promise : second.promise } })
	try {
		const press = env.buttons()[0].props.onTap
		press(); press(); flushUniversalSync(() => {})
		expect(values).toEqual([true, false])
		expect(env.buttons()[0].props.accessibilityState.pressed).toBe(false)
		first.resolve(); await Promise.resolve(); flushUniversalSync(() => {})
		expect(env.buttons()[0].props.accessibilityState.busy).toBe(true)
		second.resolve()
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(env.buttons()[0].props.accessibilityState.busy).toBeUndefined() })
	} finally { env.root.unmount() }
})

it('renders node icons, icon-only names and inherited button metadata', () => {
	const env = mount(ToggleButton, { label: 'Pin', isPressed: true, isIconOnly: true, color: 'success',
		icon: <label id="outline-icon" text="Outline" />, pressedIcon: <label id="filled-icon" text="Filled" />,
		accessibilityHint: 'Pins this item', onPressIn: vi.fn() })
	try {
		const host = env.buttons()[0]
		expect(host.props.accessibilityLabel).toBe('Pin')
		expect(host.props.accessibilityHint).toBe('Pins this item')
		expect(String(host.props.className)).toContain('vx-toggle-button--success')
		expect(env.all().some((node) => node.props?.id === 'filled-icon')).toBe(true)
		expect(env.all().some((node) => node.props?.id === 'outline-icon')).toBe(false)
	} finally { env.root.unmount() }
})

it('group membership owns single/multiple selection and ignores member save actions', () => {
	const changes = vi.fn(), action = vi.fn(), local = vi.fn()
	function Group(props: any) { return <ToggleButtonGroup {...props} label="View" onChange={changes} size="sm">
		<ToggleButton value="list" label="List" pressedChangeAction={action} onPressedChange={local} />
		<ToggleButton value="grid" label="Grid" />
	</ToggleButtonGroup> }
	const env = mount(Group, { value: 'list' })
	try {
		expect(env.all().some((node) => node.props?.accessibilityRole === 'group' && node.props.accessibilityLabel === 'View')).toBe(true)
		expect(env.buttons()[0].props.accessibilityState.pressed).toBe(true)
		env.buttons()[0].props.onTap(); expect(changes).toHaveBeenLastCalledWith(null)
		env.buttons()[1].props.onTap(); expect(changes).toHaveBeenLastCalledWith('grid')
		expect(env.buttons()[0].props.accessibilityState.pressed).toBe(true) // parent feedback owns display
		env.render({ type: 'multiple', value: ['list'] })
		env.buttons()[1].props.onTap(); expect(changes).toHaveBeenLastCalledWith(['list', 'grid'])
		expect(action).not.toHaveBeenCalled(); expect(local).not.toHaveBeenCalled()
		expect(String(env.buttons()[0].props.className)).toContain('vx-button--size-sm')
		env.render({ value: 'list', isDisabled: true })
		expect(env.buttons().every((node) => node.props.onTap === undefined)).toBe(true)
	} finally { env.root.unmount() }
})

it('reports sync failures and ignores cached actions after unmount', () => {
	const error = new Error('failed'), errors = vi.fn(), action = vi.fn(() => { throw error })
	const env = mount(ToggleButton, { label: 'Pin', pressedChangeAction: action, onActionError: errors })
	const press = env.buttons()[0].props.onTap
	press(); expect(errors).toHaveBeenCalledWith(error)
	env.root.unmount(); press()
	expect(action).toHaveBeenCalledTimes(1)
})


it('accepted controlled toggle callbacks retain their value across a URL-driven parent update', () => {
	const events: unknown[] = []
	let update = () => {}
	vi.mocked(openUrl).mockReset().mockImplementation(() => { update(); return true })
	const env = mount(ToggleButton, { label: 'Pin', href: 'https://example.com/help', isPressed: false,
		onPressedChange: (value: boolean) => events.push(['accepted-change', value]),
		pressedChangeAction: (value: boolean) => { events.push(['accepted-save', value]) } })
	try {
		const press = env.buttons()[0].props.onTap
		update = () => env.render({ label: 'Current', isPressed: true,
			onPressedChange: (value: boolean) => events.push(['current', value]) })
		press(); flushUniversalSync(() => {})
		expect(events).toEqual([['accepted-change', true], ['accepted-save', true]])
		expect(env.buttons()[0].props.accessibilityState.pressed).toBe(true)
		press(); expect(events).toEqual([['accepted-change', true], ['accepted-save', true], ['current', false]])
	} finally { env.root.unmount(); vi.mocked(openUrl).mockReset() }
})

it('an accepted local toggle retains local intent through URL-driven controlled mode entry and exit', () => {
	const events: boolean[] = []
	let update = () => {}
	vi.mocked(openUrl).mockReset().mockImplementation(() => { update(); return true })
	const env = mount(ToggleButton, { label: 'Pin', href: 'https://example.com/help', onPressedChange: (value: boolean) => events.push(value) })
	try {
		const press = env.buttons()[0].props.onTap
		update = () => env.render({ label: 'Controlled', isPressed: true })
		press(); flushUniversalSync(() => {}); expect(events).toEqual([true])
		env.render({ label: 'Local', onPressedChange: (value: boolean) => events.push(value) })
		expect(env.buttons()[0].props.accessibilityState.pressed).toBe(true)
		press(); flushUniversalSync(() => {})
		expect(events).toEqual([true, false]); expect(env.buttons()[0].props.accessibilityState.pressed).toBe(false)
	} finally { env.root.unmount(); vi.mocked(openUrl).mockReset() }
})

it('a throwing accepted toggle notification preserves local intent and skips its save callback', () => {
	const failure = new Error('notification'), errors = vi.fn(), save = vi.fn()
	const env = mount(ToggleButton, { label: 'Pin', onPressedChange: () => { throw failure }, pressedChangeAction: save, onActionError: errors })
	try {
		const press = env.buttons()[0].props.onTap
		press(); flushUniversalSync(() => {})
		expect(errors).toHaveBeenCalledWith(failure); expect(save).not.toHaveBeenCalled()
		expect(env.buttons()[0].props.accessibilityState.pressed).toBe(true)
		env.render({ label: 'Pin', pressedChangeAction: save, onActionError: errors })
		press(); expect(save).toHaveBeenCalledWith(false)
	} finally { env.root.unmount() }
})
