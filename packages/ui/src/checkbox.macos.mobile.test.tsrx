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
