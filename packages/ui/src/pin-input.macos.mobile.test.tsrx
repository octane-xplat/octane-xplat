/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { PinInput } from './PinInput.macos.tsrx'
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
	return { root, render, all, fields: () => all().filter((node) => node.type === 'textfield') }
}

it('gives PIN cells unique IDs/names and one standalone Field owner', () => {
	const env = mount(PinInput, { id: 'code', label: 'Verification code', description: 'Four characters', length: 4 })
	try {
		expect(env.fields().map((field) => field.props.id)).toEqual(['code-digit-1', 'code-digit-2', 'code-digit-3', 'code-digit-4'])
		expect(env.fields().map((field) => field.props.accessibilityLabel)).toEqual([
			'Verification code, digit 1 of 4', 'Verification code, digit 2 of 4', 'Verification code, digit 3 of 4', 'Verification code, digit 4 of 4',
		])
		expect(env.all().map((node) => node.props?.text).filter((text) => text === 'Verification code')).toHaveLength(1)
		expect(env.all().filter((node) => String(node.props?.className).split(' ').includes('vx-field'))).toHaveLength(1)
	} finally { env.root.unmount() }
})

it('inherits parent Field state/identity and blocks PIN changes', () => {
	const changes: string[] = []
	function Parent(props: any) {
		return <FormField inputID="pin" label="Account code" isDisabled={props.disabled} isReadOnly={props.readonly}>
			<PinInput onValueChange={(value) => changes.push(value)} />
		</FormField>
	}
	const env = mount(Parent, { disabled: true })
	try {
		for (const state of [{ disabled: true }, { readonly: true }]) {
			env.render(state)
			env.fields()[0].props.onTextChange('1'); flushUniversalSync(() => {})
			expect(changes).toEqual([])
			expect(env.fields().every((field) => field.props.id.startsWith('pin-digit-'))).toBe(true)
			expect(new Set(env.fields().map((field) => field.props.id)).size).toBe(4)
		}
	} finally { env.root.unmount() }
})

it('cancels controlled pending focus if blocked before accepting input', async () => {
	const env = mount(PinInput, { value: '', length: 4 })
	const focus = vi.fn()
	try {
		for (const field of env.fields()) field.window = { makeFirstResponder: focus }
		env.fields()[0].props.onTextChange('1'); flushUniversalSync(() => {})
		env.render({ value: '1', length: 4, isReadOnly: true })
		await vi.waitFor(() => expect(env.fields()[1].props.editable).toBe(false))
		await new Promise((resolve) => setTimeout(resolve, 0))
		expect(focus).not.toHaveBeenCalled()
	} finally { env.root.unmount() }
})

it('retains entered values/hosts when standalone validation metadata changes', () => {
	const env = mount(PinInput, { length: 4 })
	try {
		const first = env.fields()[0]
		first.props.onTextChange('1'); flushUniversalSync(() => {})
		env.render({ length: 4, label: 'Code', status: { type: 'error', message: 'Try again' } })
		expect(env.fields()[0]).toBe(first)
		expect(first.props.value).toBe('1')
		expect(env.all().map((node) => node.props?.text)).toContain('Try again')
	} finally { env.root.unmount() }
})
