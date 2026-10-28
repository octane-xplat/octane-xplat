/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Switch } from './controls.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'

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
		env.tap()
		expect(events).toHaveLength(2)
		task.resolve()
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(host.props.accessibilityState.busy).toBe(false) })
		expect(host.props.accessibilityState.checked).toBe(true)
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
