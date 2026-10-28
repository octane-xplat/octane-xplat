/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { InputNumber } from './InputNumber.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'

function mount(component: any, props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(component, next); flushUniversalSync(() => {}) }
	render(props)
	const all = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	const input = () => all().find((node) => node.type === 'textfield')
	const classNodes = (name: string) => all().filter((node) => String(node.props?.className).split(' ').includes(name))
	return { root, render, all, input, classNodes }
}

it('AppKit numeric fields format values, show units, and preserve the input while hiding steppers', () => {
	const env = mount(InputNumber, { defaultValue: 3, label: 'Mass', units: 'kg', formatValue: (value: number) => value.toFixed(1) })
	try {
		const input = env.input()
		expect(input.props.value).toBe('3.0')
		expect(env.classNodes('vx-inputnumber-step')).toHaveLength(2)
		expect(env.classNodes('vx-inputnumber-units')[0].props.text).toBe('kg')
		expect(input.props.accessibilityLabel).toBe('Mass')
		env.render({ hasNumberSteppers: false, label: 'Mass', units: 'g' })
		expect(env.input()).toBe(input)
		expect(input.props.value).toBe('3')
		expect(env.classNodes('vx-inputnumber-step')).toHaveLength(0)
		expect(env.classNodes('vx-inputnumber-units')[0].props.text).toBe('g')
	} finally { env.root.unmount() }
})

it('AppKit numeric clear reports null before onClear and retains uncontrolled stepping', () => {
	const events: unknown[] = []
	const props = { defaultValue: 2, hasClear: true, min: 0, max: 3, step: 2,
		onValueChange: (value: number | null) => events.push(value), onClear: () => events.push('clear') }
	const env = mount(InputNumber, props)
	try {
		env.classNodes('vx-inputnumber-clear')[0].props.onTap()
		flushUniversalSync(() => {})
		expect(events).toEqual([null, 'clear'])
		expect(env.input().props.value).toBe('')
		expect(env.classNodes('vx-inputnumber-clear')).toHaveLength(0)
		env.classNodes('vx-inputnumber-step')[1].props.onTap()
		flushUniversalSync(() => {})
		expect(env.input().props.value).toBe('2')
		env.classNodes('vx-inputnumber-step')[1].props.onTap()
		flushUniversalSync(() => {})
		expect(env.input().props.value).toBe('3')
	} finally { env.root.unmount() }
})

it('controlled null wins over a default and requests stepping without changing the display', () => {
	const requests: unknown[] = []
	const env = mount(InputNumber, { value: null, defaultValue: 9, onValueChange: (value: unknown) => requests.push(value), hasClear: true })
	try {
		expect(env.input().props.value).toBe('')
		expect(env.classNodes('vx-inputnumber-clear')).toHaveLength(0)
		env.classNodes('vx-inputnumber-step')[1].props.onTap()
		flushUniversalSync(() => {})
		expect(requests).toEqual([1])
		expect(env.input().props.value).toBe('')
	} finally { env.root.unmount() }
})

it('an enclosing Field blocks numeric actions and owns labels/status without duplicate wrappers or IDs', () => {
	const requests: unknown[] = []
	function Parent(props: any) {
		return <FormField label="Count" inputID="count" isDisabled={props.isDisabled} isReadOnly={props.isReadOnly}
			description="In stock" status={{ type: 'error', message: 'Check stock' }}>
			<InputNumber id="count" defaultValue={2} hasClear onValueChange={(value) => requests.push(value)} />
		</FormField>
	}
	const env = mount(Parent, { isDisabled: true })
	try {
		expect(env.classNodes('vx-field')).toHaveLength(1)
		expect(env.all().filter((node) => node.props?.id === 'count')).toHaveLength(1)
		expect(env.input().props.accessibilityLabel).toBe('Count')
		expect(env.input().props.accessibilityHint).toBe('In stock. Check stock')
		for (const state of [{ isDisabled: true }, { isReadOnly: true }]) {
			env.render(state)
			for (const step of env.classNodes('vx-inputnumber-step')) expect(step.props.onTap).toBeUndefined()
			expect(env.input().props.editable).toBe(false)
			expect(env.classNodes('vx-inputnumber-clear')).toHaveLength(0)
		}
		expect(requests).toEqual([])
	} finally { env.root.unmount() }
})

it('adding numeric validation metadata retains the uncontrolled value and input identity', () => {
	const env = mount(InputNumber, { defaultValue: 2 })
	try {
		const input = env.input()
		input.props.onTextChange('7')
		flushUniversalSync(() => {})
		env.render({ label: 'Amount', status: { type: 'error', message: 'Check amount' } })
		expect(env.input()).toBe(input)
		expect(input.props.value).toBe('7')
		expect(env.classNodes('vx-field')).toHaveLength(1)
	} finally { env.root.unmount() }
})
