/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Switch } from './controls.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'

afterEach(() => vi.unstubAllGlobals())

function mount(component: any, props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(component, next); flushUniversalSync(() => {}) }
	render(props)
	const control = (): any => {
		const walk = (node: any): any => node.props?.accessibilityRole === 'switch' ? node : node.children?.map(walk).find(Boolean)
		return container.children.map(walk).find(Boolean)
	}
	const tap = () => { control().props.onTap?.(); flushUniversalSync(() => {}) }
	const all = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	return { root, render, control, tap, all }
}
function deferred() {
	let resolve!: () => void, reject!: (error: unknown) => void
	const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no })
	return { promise, resolve, reject }
}

it('calls changeAction after onChange, marks pending and prevents overlapping actions', async () => {
	const task = deferred(), events: unknown[] = []
	const env = mount(Switch, { defaultValue: false, onChange: (next: boolean) => events.push(['change', next]),
		changeAction: (next: boolean) => { events.push(['action', next]); return task.promise } })
	try {
		const host = env.control()
		const activate = host.props.onTap
		env.tap()
		activate() // Cached same-frame handler is blocked by the token too.
		expect(events).toEqual([['change', true], ['action', true]])
		expect(env.control()).toBe(host)
		expect(host.props.accessibilityState).toMatchObject({ checked: true, busy: true })
		expect(env.all().filter((node) => String(node.props?.className).includes('vx-spinner--size-xsm'))).toHaveLength(1)
		env.tap()
		expect(events).toHaveLength(2)
		task.resolve()
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(host.props.accessibilityState.busy).toBe(false) })
		expect(host.props.accessibilityState.checked).toBe(true)
		expect(env.all().filter((node) => String(node.props?.className).includes('vx-spinner--appkit'))).toHaveLength(0)
	} finally { env.root.unmount() }
})

it('reverts a failed uncontrolled action and reports the previous state', async () => {
	const task = deferred(), changes: boolean[] = []
	const env = mount(Switch, { defaultValue: true, onChange: (value: boolean) => changes.push(value), changeAction: () => task.promise })
	try {
		env.tap()
		expect(env.control().props.accessibilityState.checked).toBe(false)
		task.reject(new Error('save failed'))
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(changes).toEqual([false, true]) })
		expect(env.control().props.accessibilityState).toMatchObject({ checked: true, busy: false })
	} finally { env.root.unmount() }
})

it('keeps controlled display and rolls back synchronous action failures', () => {
	const changes: boolean[] = []
	const env = mount(Switch, { value: false, defaultValue: true, onChange: (value: boolean) => changes.push(value),
		changeAction: () => { throw new Error('save failed') } })
	try {
		env.tap()
		expect(changes).toEqual([true, false])
		expect(env.control().props.accessibilityState).toMatchObject({ checked: false, busy: false })
	} finally { env.root.unmount() }
})

it('ignores completion after unmount and honors inherited Field blocking', async () => {
	const task = deferred(), onChange = vi.fn(), changeAction = vi.fn(() => task.promise)
	function Parent(props: any) {
		return <FormField isDisabled={props.disabled} isReadOnly={props.readonly}><Switch onChange={onChange} changeAction={changeAction} /></FormField>
	}
	const env = mount(Parent, { disabled: true })
	for (const state of [{ disabled: true }, { readonly: true }]) {
		env.render(state); env.tap()
	}
	expect(changeAction).not.toHaveBeenCalled()
	env.render({}); env.tap()
	expect(onChange).toHaveBeenCalledTimes(1)
	env.root.unmount()
	task.reject(new Error('late save failure'))
	await Promise.resolve()
	expect(onChange).toHaveBeenCalledTimes(1)
})


it('renders standalone metadata, style forms and stable state as label layout changes', () => {
	const env = mount(Switch, { id: 'alerts', defaultValue: true, label: 'Alerts', description: 'Keep me informed',
		isRequired: true, status: { type: 'error', message: 'Save failed' }, className: ['preference', { active: true }], style: 'width:240px' })
	try {
		const host = env.control()
		const labels = () => env.all().map((node) => node.props?.text).filter(Boolean)
		expect(labels()).toEqual(expect.arrayContaining(['Alerts *', 'Keep me informed', 'Save failed']))
		expect(host.props.id).toBe('alerts')
		expect(host.props.accessibilityHint).toContain('Save failed')
		expect(host.props.accessibilityState).toMatchObject({ required: true, invalid: true, checked: true })
		const outer = env.all().find((node) => String(node.props?.className).includes('vx-switch-field--appkit'))
		expect(outer.props.className).toContain('preference active')
		expect(outer.props.style).toContain('width:240px')
		env.render({ id: 'alerts', label: 'Notifications', labelPosition: 'start', labelSpacing: 'spread', size: 'sm' })
		expect(env.control()).toBe(host)
		expect(host.props.accessibilityState.checked).toBe(true)
		expect(host.props.className).toContain('vx-switch--size-sm')
		const row = env.all().find((node) => String(node.props?.className).includes('vx-switch-container--appkit'))
		expect(row.props.className).toContain('vx-switch-container--label-start')
		expect(row.props.className).toContain('vx-switch-container--spread')
		expect(labels()).not.toContain('Save failed')
		env.render({ id: 'alerts', label: 'Hidden name', description: 'Hidden description', isLabelHidden: true })
		expect(env.control()).toBe(host)
		expect(labels()).not.toContain('Hidden name')
		expect(labels()).not.toContain('Hidden description')
		expect(host.props.accessibilityLabel).toBe('Hidden name')
	} finally { env.root.unmount() }
})

it('leaves labels and status with an enclosing Field', () => {
	function Parent() {
		return <FormField inputID="field-switch" label="Shared label" description="Shared description" status={{ type: 'error', message: 'Shared status' }}>
			<Switch defaultValue />
		</FormField>
	}
	const env = mount(Parent, {})
	try {
		const text = env.all().map((node) => node.props?.text)
		expect(text.filter((value) => value === 'Shared label')).toHaveLength(1)
		expect(text.filter((value) => value === 'Shared status')).toHaveLength(1)
		expect(env.control().props.id).toBe('field-switch')
		expect(env.control().props.accessibilityLabel).toBe('Shared label')
	} finally { env.root.unmount() }
})


it('routes label presses through the same save owner and releases Tab exclusion', async () => {
	const release = vi.fn(), suppress = vi.fn(() => release), focus = vi.fn()
	vi.stubGlobal('__xplatAppKit', { suppressTabStop: suppress })
	const task = deferred(), changes: boolean[] = [], save = vi.fn(() => task.promise)
	const env = mount(Switch, { label: 'Alerts', defaultValue: false, changeAction: save, onChange: (value: boolean) => changes.push(value) })
	const label = () => env.all().find((node) => node.props?.className === 'vx-field-label-press--appkit')
	try {
		const host = env.control()
		host.window = { makeFirstResponder: focus }
		expect(suppress).toHaveBeenCalledTimes(1)
		label().props.onTap(); flushUniversalSync(() => {})
		expect(focus).toHaveBeenCalledWith(host)
		expect(changes).toEqual([true])
		expect(save).toHaveBeenCalledWith(true)
		expect(host.props.accessibilityState.busy).toBe(true)
		expect(label().props.onTap).toBeUndefined()
		task.reject(new Error('save failed'))
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(changes).toEqual([true, false]) })
		expect(env.control()).toBe(host)
		expect(suppress).toHaveBeenCalledTimes(1)
		expect(release).not.toHaveBeenCalled()
	} finally { env.root.unmount() }
	expect(release).toHaveBeenCalledTimes(1)
})

it('does not activate hidden, blocked or unsupported label targets', () => {
	vi.stubGlobal('__xplatAppKit', { suppressTabStop: () => () => {} })
	const env = mount(Switch, { label: 'Alerts', isReadOnly: true })
	const labels = () => env.all().filter((node) => node.props?.className === 'vx-field-label-press--appkit')
	try {
		expect(labels()[0].props.onTap).toBeUndefined()
		env.render({ label: 'Alerts', isDisabled: true })
		expect(labels()[0].props.onTap).toBeUndefined()
		env.render({ label: 'Alerts', isLabelHidden: true })
		expect(labels()).toHaveLength(0)
		vi.stubGlobal('__xplatAppKit', {})
		env.render({ label: 'Alerts' })
		expect(labels()[0].props.onTap).toBeUndefined()
	} finally { env.root.unmount() }
})

it('shows external loading feedback and removes it when the prop is dropped', () => {
	const env = mount(Switch, { defaultValue: true, isLoading: true })
	try {
		const host = env.control()
		const rings = () => env.all().filter((node) => String(node.props?.className).includes('vx-spinner--size-xsm'))
		expect(rings()).toHaveLength(1)
		expect(host.props.accessibilityState.busy).toBe(true)
		env.render({})
		expect(env.control()).toBe(host)
		expect(host.props.accessibilityState).toMatchObject({ checked: true, busy: false })
		expect(rings()).toHaveLength(0)
	} finally { env.root.unmount() }
})


it('claims switch ownership before onChange reentry and preserves detached saves without UI completion', async () => {
	const task = deferred(), changes = vi.fn(), save = vi.fn(() => task.promise)
	let reenter = () => {}
	const env = mount(Switch, { onChange: (value: boolean) => { changes(value); if (changes.mock.calls.length === 1) reenter() }, changeAction: save })
	try {
		reenter = env.control().props.onTap; reenter(); flushUniversalSync(() => {})
		expect(changes).toHaveBeenCalledTimes(1); expect(save).toHaveBeenCalledTimes(1)
		expect(env.control().props.accessibilityState.busy).toBe(true)
		task.resolve(); await vi.waitFor(() => { flushUniversalSync(() => {}); expect(env.control().props.accessibilityState.busy).toBe(false) })
	} finally { env.root.unmount() }
	let unmount = () => {}
	const lateTask = deferred(), lateSave = vi.fn(() => lateTask.promise), detachedChanges = vi.fn(() => unmount())
	const detached = mount(Switch, { onChange: detachedChanges, changeAction: lateSave })
	unmount = () => detached.root.unmount()
	detached.control().props.onTap(); expect(lateSave).toHaveBeenCalledWith(true)
	lateTask.reject(new Error('detached save failure')); await Promise.resolve(); await Promise.resolve()
	expect(detachedChanges).toHaveBeenCalledTimes(1)
})

it('a throwing onChange releases switch ownership without starting a save', async () => {
	const save = vi.fn(), env = mount(Switch, { onChange: () => { throw new Error('change failed') }, changeAction: save })
	try {
		expect(() => env.control().props.onTap()).toThrow('change failed')
		expect(save).not.toHaveBeenCalled()
		const changed = vi.fn(); env.render({ onChange: changed, changeAction: save })
		env.tap(); expect(changed).toHaveBeenCalledOnce(); expect(save).toHaveBeenCalledOnce()
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(env.control().props.accessibilityState.busy).toBe(false) })
	} finally { env.root.unmount() }
})

it('rollback callback faults release switch busy ownership without a rejected settlement promise', async () => {
	const task = deferred(), logged = vi.spyOn(console, 'error').mockImplementation(() => {})
	const env = mount(Switch, { defaultValue: true, onChange: (value: boolean) => { if (value) throw new Error('rollback failed') }, changeAction: () => task.promise })
	try {
		env.tap(); task.reject(new Error('save failed'))
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(env.control().props.accessibilityState.busy).toBe(false) })
		expect(env.control().props.accessibilityState.checked).toBe(true)
		expect(logged).toHaveBeenCalledWith('[macos-switch] rollback failed', expect.any(Error))
	} finally { env.root.unmount(); logged.mockRestore() }
})

it('cached switch handlers read current blocking props and callbacks', async () => {
	const original = vi.fn(), current = vi.fn(), save = vi.fn(), env = mount(Switch, { onChange: original })
	try {
		const cached = env.control().props.onTap
		for (const blocked of [{ isDisabled: true }, { isReadOnly: true }]) {
			env.render({ ...blocked, onChange: current, changeAction: save }); cached()
		}
		expect(original).not.toHaveBeenCalled(); expect(current).not.toHaveBeenCalled(); expect(save).not.toHaveBeenCalled()
		env.render({ onChange: current, changeAction: save }); cached(); flushUniversalSync(() => {})
		expect(original).not.toHaveBeenCalled(); expect(current).toHaveBeenCalledWith(true); expect(save).toHaveBeenCalledWith(true)
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(env.control().props.accessibilityState.busy).toBe(false) })
	} finally { env.root.unmount() }
})

// Authored object-driver models only; native input/ref timing remains unqualified.
it('advances local switch requests before render without a save', () => {
	const changes: boolean[] = []
	const env = mount(Switch, { defaultValue: false, onChange: (value: boolean) => changes.push(value) })
	try {
		const tap = env.control().props.onTap
		tap(); tap(); tap(); flushUniversalSync(() => {})
		expect(changes).toEqual([true, false, true])
		expect(env.control().props.accessibilityState.checked).toBe(true)
	} finally { env.root.unmount() }
})

it('restores local switch intent before synchronous rollback callbacks and the next request', () => {
	const changes: boolean[] = [], saved: boolean[] = []
	let tap = () => {}
	const env = mount(Switch, { onChange: (value: boolean) => { changes.push(value); if (!value) tap() },
		changeAction: (value: boolean) => { saved.push(value); throw Error('save failed') } })
	try {
		tap = env.control().props.onTap
		tap(); tap(); flushUniversalSync(() => {})
		expect(changes).toEqual([true, false, true, false])
		expect(saved).toEqual([true, true])
		expect(env.control().props.accessibilityState).toMatchObject({ checked: false, busy: false })
	} finally { env.root.unmount() }
})

it('restores local switch intent after async failure and preserves it for rapid no-save requests', async () => {
	const task = deferred(), changes: boolean[] = [], change = (value: boolean) => changes.push(value)
	const env = mount(Switch, { onChange: change, changeAction: () => task.promise })
	try {
		const tap = env.control().props.onTap
		tap(); tap(); expect(changes).toEqual([true])
		task.reject(Error('save failed'))
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(changes).toEqual([true, false]) })
		env.render({ onChange: change })
		tap(); tap(); flushUniversalSync(() => {})
		expect(changes).toEqual([true, false, true, false])
		expect(env.control().props.accessibilityState).toMatchObject({ checked: false, busy: false })
	} finally { env.root.unmount() }
})

it('keeps switch controlled requests parent-owned and retains the original local seed', () => {
	const changes: boolean[] = [], change = (value: boolean) => changes.push(value)
	const env = mount(Switch, { value: false, defaultValue: true, onChange: change })
	try {
		const tap = env.control().props.onTap
		tap(); tap(); flushUniversalSync(() => {})
		expect(changes).toEqual([true, true]); expect(env.control().props.accessibilityState.checked).toBe(false)
		env.render({ defaultValue: false, onChange: change })
		expect(env.control().props.accessibilityState.checked).toBe(true)
		tap(); tap(); flushUniversalSync(() => {})
		expect(changes).toEqual([true, true, false, true])
		expect(env.control().props.accessibilityState.checked).toBe(true)
	} finally { env.root.unmount() }
})

it('retains local switch intent when a forward callback throws before rendering', () => {
	const changes: boolean[] = [], save = vi.fn()
	let fail = true
	const env = mount(Switch, { onChange: (value: boolean) => { changes.push(value); if (fail) throw Error('consumer failure') }, changeAction: save })
	try {
		const tap = env.control().props.onTap
		expect(tap).toThrow('consumer failure'); expect(save).not.toHaveBeenCalled()
		fail = false; tap(); expect(changes).toEqual([true, false]); expect(save).toHaveBeenCalledWith(false)
	} finally { env.root.unmount() }
})
