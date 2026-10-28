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
	return { root, render, control, tap }
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
