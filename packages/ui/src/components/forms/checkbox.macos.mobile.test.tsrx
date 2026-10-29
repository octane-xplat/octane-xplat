/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Checkbox } from './Checkbox.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'

function mount(component: any, props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(component, next); flushUniversalSync(() => {}) }
	const all = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	const control = () => all().find((node) => node.props?.accessibilityRole === 'checkbox')
	render(props)
	return { root, render, all, control }
}

it('renders metadata and retains mixed/uncontrolled state across metadata changes', () => {
	const changes: boolean[] = []
	const env = mount(Checkbox, { id: 'include', defaultValue: 'indeterminate', label: 'Include', description: 'Choose records',
		status: { type: 'error', message: 'Choose a record' }, onChange: (value: boolean) => changes.push(value) })
	try {
		const host = env.control(), labels = env.all().map((node) => node.props?.text)
		expect(labels).toEqual(expect.arrayContaining(['Include', 'Choose records', 'Choose a record']))
		expect(host.props.accessibilityState.checked).toBe('mixed')
		expect(host.props.accessibilityHint).toContain('Choose a record')
		host.props.onTap(); flushUniversalSync(() => {})
		expect(changes).toEqual([true])
		env.render({ id: 'include', label: 'Selected', isLabelHidden: true, style: 'width:240px', className: ['records', { active: true }] })
		expect(env.control()).toBe(host)
		expect(host.props.accessibilityState.checked).toBe(true)
		expect(host.props.accessibilityValue).toBeUndefined()
		expect(host.props.accessibilityLabel).toBe('Selected')
		expect(env.all().map((node) => node.props?.text)).not.toContain('Selected')
		const outer = env.all().find((node) => String(node.props?.className).includes('vx-checkbox-field--appkit'))
		expect(outer.props.className).toContain('records active')
		expect(outer.props.style).toContain('width:240px')
	} finally { env.root.unmount() }
})

it('uses the parent Field metadata once and blocks disabled/read-only actions', () => {
	const changes: boolean[] = []
	function Parent(props: any) {
		return <FormField inputID="check" label="Parent" description="Parent description" status={{ type: 'error', message: 'Parent error' }}
			isDisabled={props.disabled} isReadOnly={props.readonly}>
			<Checkbox label="Own accessible name" onChange={(value) => changes.push(value)} />
		</FormField>
	}
	const env = mount(Parent, { disabled: true })
	try {
		for (const state of [{ disabled: true }, { readonly: true }]) {
			env.render(state)
			const text = env.all().map((node) => node.props?.text)
			expect(text.filter((value) => value === 'Parent')).toHaveLength(1)
			expect(text.filter((value) => value === 'Parent error')).toHaveLength(1)
			expect(text).not.toContain('Own accessible name')
			expect(env.control().props.id).toBe('check')
			expect(env.control().props.accessibilityLabel).toBe('Own accessible name')
			expect(env.control().props.onTap).toBeUndefined()
		}
		expect(changes).toEqual([])
	} finally { env.root.unmount() }
})

it('keeps the controlled display until the parent accepts the requested value', () => {
	const changes: boolean[] = []
	const env = mount(Checkbox, { value: false, defaultValue: true, onChange: (value: boolean) => changes.push(value) })
	try {
		env.control().props.onTap(); flushUniversalSync(() => {})
		expect(changes).toEqual([true])
		expect(env.control().props.accessibilityState.checked).toBe(false)
	} finally { env.root.unmount() }
})

// Authored object-driver models only; native input and ref timing remain unqualified.
it('advances rapid held-handler local requests from mixed before a render', () => {
	const changes: boolean[] = []
	const env = mount(Checkbox, { defaultValue: 'indeterminate', onChange: (value: boolean) => changes.push(value) })
	try {
		const tap = env.control().props.onTap
		tap(); tap(); tap(); flushUniversalSync(() => {})
		expect(changes).toEqual([true, false, true])
		expect(env.control().props.accessibilityState.checked).toBe(true)
	} finally { env.root.unmount() }
})

it('claims callbacks before reentry and releases for a later independent request', () => {
	const changes: boolean[] = []
	let tap: () => void = () => {}
	const env = mount(Checkbox, { onChange: (value: boolean) => { changes.push(value); if (changes.length === 1) tap() } })
	try {
		tap = env.control().props.onTap
		tap(); expect(changes).toEqual([true])
		tap(); flushUniversalSync(() => {})
		expect(changes).toEqual([true, false])
		expect(env.control().props.accessibilityState.checked).toBe(false)
	} finally { env.root.unmount() }
})

it('propagates consumer failure while retaining local intent and releasing ownership', () => {
	const changes: boolean[] = []
	let fail = true
	const env = mount(Checkbox, { onChange: (value: boolean) => { changes.push(value); if (fail) throw Error('consumer failure') } })
	try {
		const tap = env.control().props.onTap
		expect(tap).toThrow('consumer failure')
		fail = false; tap(); flushUniversalSync(() => {})
		expect(changes).toEqual([true, false])
		expect(env.control().props.accessibilityState.checked).toBe(false)
	} finally { env.root.unmount() }
})

it('held callbacks read current inherited gates and the current controlled callback', () => {
	const old: boolean[] = [], current: boolean[] = []
	function Parent(props: any) {
		return <FormField inputID="current-check" isDisabled={props.disabled} isReadOnly={props.readonly}>
			<Checkbox value={props.value} onChange={props.change} />
		</FormField>
	}
	const env = mount(Parent, { value: false, change: (value: boolean) => old.push(value) })
	try {
		const host = env.control(), tap = host.props.onTap
		for (const blocked of [{ disabled: true }, { readonly: true }]) {
			env.render({ ...blocked, value: true, change: (value: boolean) => current.push(value) })
			tap()
		}
		expect(old).toEqual([]); expect(current).toEqual([])
		env.render({ value: true, change: (value: boolean) => current.push(value) })
		tap(); flushUniversalSync(() => {})
		expect(env.control()).toBe(host); expect(current).toEqual([false]); expect(old).toEqual([])
		expect(host.props.accessibilityState.checked).toBe(true)
	} finally { env.root.unmount() }
})

it('retires held callbacks when a consumer detaches the control', () => {
	const changes: boolean[] = []
	let remove = () => {}
	const env = mount(Checkbox, { onChange: (value: boolean) => { changes.push(value); remove() } })
	try {
		const tap = env.control().props.onTap
		remove = () => env.root.unmount()
		tap(); tap()
		expect(changes).toEqual([true])
	} finally { env.root.unmount() }
})

it('keeps controlled rejection authoritative and retains the original local seed on release', () => {
	const changes: boolean[] = [], change = (value: boolean) => changes.push(value)
	const env = mount(Checkbox, { value: false, defaultValue: 'indeterminate', onChange: change })
	try {
		const tap = env.control().props.onTap
		tap(); tap(); flushUniversalSync(() => {})
		expect(changes).toEqual([true, true]); expect(env.control().props.accessibilityState.checked).toBe(false)
		env.render({ defaultValue: false, onChange: change })
		expect(env.control().props.accessibilityState.checked).toBe('mixed')
		tap(); tap(); flushUniversalSync(() => {})
		expect(changes).toEqual([true, true, true, false])
		expect(env.control().props.accessibilityState.checked).toBe(false)
	} finally { env.root.unmount() }
})
