/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { TextInput, TextArea } from './text-controls.macos.tsrx'

function mount(component: any, props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(component, next); flushUniversalSync(() => {}) }
	render(props)
	const find = (type: string): any => {
		const walk = (node: any): any => node.type === type ? node : node.children?.map(walk).find(Boolean)
		return container.children.map(walk).find(Boolean)
	}
	return { root, render, find }
}

it('AppKit multiline fields submit only for enabled done/send actions', () => {
	let submits = 0
	const onSubmit = () => { submits++ }
	const env = mount(TextArea, { returnKeyType: 'send', onSubmit })
	try {
		env.find('textview').props.onSubmit()
		expect(submits).toBe(1)
		for (const returnKeyType of [undefined, 'next', 'search', 'go']) {
			env.render({ returnKeyType, onSubmit })
			expect(env.find('textview').props.onSubmit).toBeUndefined()
		}
		for (const flag of ['isDisabled', 'isReadOnly']) {
			env.render({ returnKeyType: 'done', onSubmit, [flag]: true })
			expect(env.find('textview').props.onSubmit).toBeUndefined()
		}
		env.render({ returnKeyType: 'done', onSubmit })
		env.find('textview').props.onSubmit()
		expect(submits).toBe(2)
	} finally { env.root.unmount() }
})

it('AppKit text controls ignore edit callbacks after becoming disabled or read-only', () => {
	for (const component of [TextInput, TextArea]) {
		const changes: string[] = []
		const onChange = (value: string) => changes.push(value)
		const env = mount(component, { onChange, defaultValue: 'kept' })
		const type = component === TextInput ? 'textfield' : 'textview'
		try {
			for (const flag of ['isDisabled', 'isReadOnly']) {
				env.render({ onChange, [flag]: true })
				env.find(type).props.onTextChange('blocked')
				flushUniversalSync(() => {})
				expect(changes).toEqual([])
				expect(env.find(type).props.value).toBe('kept')
			}
		} finally { env.root.unmount() }
	}
})
