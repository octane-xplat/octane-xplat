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

function key(target: any, overrides: any = {}) {
	return { target, key: 'Backspace', code: 'Backspace', altKey: false, ctrlKey: false, metaKey: false, shiftKey: false,
		isComposing: false, repeat: false, defaultPrevented: false, stopped: false,
		preventDefault() { this.defaultPrevented = true }, stopPropagation() { this.stopped = true }, ...overrides }
}

it('empty-cell Backspace requests previous-cell focus without editing controlled or uncontrolled code', () => {
	for (const controlled of [false, true]) {
		const changes = vi.fn(), complete = vi.fn(), focus = vi.fn()
		const env = mount(PinInput, { id: 'pin', length: 4, ...(controlled ? { value: '12' } : {}), onValueChange: changes, onComplete: complete })
		try {
			if (!controlled) {
				env.fields()[0].props.onTextChange('1'); flushUniversalSync(() => {})
				env.fields()[1].props.onTextChange('2'); flushUniversalSync(() => {})
			}
			changes.mockClear(); complete.mockClear()
			for (const field of env.fields()) field.window = { makeFirstResponder: focus }
			const group = env.all().find((node) => node.props?.id === 'pin'), fields = env.fields()
			const event = key(fields[2]); group.props.onKeyDown(event)
			expect(event.defaultPrevented).toBe(true)
			expect(event.stopped).toBe(true)
			expect(focus).toHaveBeenCalledWith(fields[1])
			expect(fields.map((field) => field.props.value)).toEqual(['1', '2', '', ''])
			expect(changes).not.toHaveBeenCalled(); expect(complete).not.toHaveBeenCalled()
		} finally { env.root.unmount() }
	}
})

it('PIN Backspace preserves native filled-cell editing, IME, shortcuts and unrelated targets', () => {
	const env = mount(PinInput, { id: 'pin', value: '12' }), focus = vi.fn()
	try {
		const fields = env.fields(), group = env.all().find((node) => node.props?.id === 'pin')
		for (const field of fields) field.window = { makeFirstResponder: focus }
		for (const event of [key(fields[0]), key(fields[1]), key(fields[3]), key({}),
			...['isComposing', 'altKey', 'ctrlKey', 'metaKey', 'shiftKey', 'defaultPrevented'].map((flag) => key(fields[2], { [flag]: true })),
			key(fields[2], { key: 'Delete' })]) {
			const wasPrevented = event.defaultPrevented
			group.props.onKeyDown(event)
			expect(event.defaultPrevented).toBe(wasPrevented)
			expect(event.stopped).toBe(false)
		}
		expect(focus).not.toHaveBeenCalled()
		for (const patch of [{ isDisabled: true }, { isReadOnly: true }]) {
			env.render({ id: 'pin', value: '12', ...patch })
			const event = key(fields[2]); group.props.onKeyDown(event)
			expect(event.defaultPrevented).toBe(false)
		}
		expect(focus).not.toHaveBeenCalled()
	} finally { env.root.unmount() }
})
