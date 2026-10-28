/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { RadioGroup } from './RadioGroup.macos.tsrx'
import { RadioListItem } from './RadioListItem.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'

function mount(component: any, props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(component, next); flushUniversalSync(() => {}) }
	const all = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	render(props)
	return { root, render, all, rows: () => all().filter((node) => node.props?.accessibilityRole === 'radio') }
}

it('options and children share uncontrolled selection, descriptions and trailing content', () => {
	const changes: string[] = []
	function Fixture(props: any) {
		return <RadioGroup {...props} options={[{ value: 'a', label: 'Alpha', description: 'First option', endContent: <label text="Free" /> }]}>
			<RadioListItem id="beta" value="b" label="Beta" description="Second option" />
		</RadioGroup>
	}
	const env = mount(Fixture, { label: 'Plan', defaultValue: 'a', onValueChange: (value: string) => changes.push(value) })
	try {
		const [alpha, beta] = env.rows()
		expect(alpha.props.accessibilityState.checked).toBe(true)
		expect(beta.props.accessibilityHint).toBe('Second option')
		expect(env.all().map((node) => node.props?.text)).toEqual(expect.arrayContaining(['Plan', 'First option', 'Free', 'Second option']))
		beta.props.onTap(); flushUniversalSync(() => {})
		expect(changes).toEqual(['b'])
		expect(alpha.props.accessibilityState.checked).toBe(false)
		expect(beta.props.accessibilityState.checked).toBe(true)
		env.render({ label: 'Updated plan', onValueChange: (value: string) => changes.push(value) })
		expect(env.rows()[1]).toBe(beta)
		expect(beta.props.accessibilityState.checked).toBe(true)
		beta.props.onTap(); flushUniversalSync(() => {})
		expect(changes).toEqual(['b'])
	} finally { env.root.unmount() }
})

it('controlled requests wait for feedback and disabled/read-only groups block both forms', () => {
	const changes: string[] = []
	function Fixture(props: any) {
		return <RadioGroup {...props} options={[{ value: 'a', label: 'Alpha', isDisabled: props.optionDisabled }]}>
			<RadioListItem value="b" label="Beta" />
		</RadioGroup>
	}
	const env = mount(Fixture, { value: 'a', onValueChange: (value: string) => changes.push(value) })
	try {
		env.rows()[1].props.onTap(); flushUniversalSync(() => {})
		expect(changes).toEqual(['b'])
		expect(env.rows()[0].props.accessibilityState.checked).toBe(true)
		for (const flag of ['isDisabled', 'isReadOnly']) {
			env.render({ [flag]: true })
			expect(env.rows().every((row) => row.props.onTap === undefined)).toBe(true)
		}
		env.render({ optionDisabled: true })
		expect(env.rows()[0].props.onTap).toBeUndefined()
		expect(env.rows()[1].props.onTap).toBeTypeOf('function')
	} finally { env.root.unmount() }
})

it('inherits Field ownership/state and leaves standalone items presentational', () => {
	function Parent() {
		return <FormField label="Plan" description="Choose one" isReadOnly>
			<RadioGroup><RadioListItem value="a" label="Alpha" /></RadioGroup>
		</FormField>
	}
	const env = mount(Parent, {})
	try {
		expect(env.all().map((node) => node.props?.text).filter((text) => text === 'Plan')).toHaveLength(1)
		expect(env.all().find((node) => node.props?.accessibilityRole === 'radiogroup').props.accessibilityLabel).toBe('Plan')
		expect(env.rows()[0].props.onTap).toBeUndefined()
	} finally { env.root.unmount() }
	const standalone = mount(RadioListItem, { value: 'a', label: 'Alpha', className: ['one', { two: true }] })
	try {
		expect(standalone.rows()).toHaveLength(0)
		const row = standalone.all().find((node) => String(node.props?.className).includes('vx-radiolist-item'))
		expect(row.props.onTap).toBeUndefined()
		expect(row.props.className).toContain('one two')
	} finally { standalone.root.unmount() }
})
