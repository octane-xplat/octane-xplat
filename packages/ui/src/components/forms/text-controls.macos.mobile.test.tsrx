/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { TextInput, TextArea } from './text-controls.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'
import { SearchInput } from '../actions/controls.macos.tsrx'

function mount(component: any, props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(component, next); flushUniversalSync(() => {}) }
	render(props)
	const all = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	const find = (type: string): any => all().find((node) => node.type === type)
	return { root, render, find, all }
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


it('AppKit standalone text fields render labels, hints and status once in a column', () => {
	for (const component of [TextInput, TextArea]) {
		const env = mount(component, { id: 'name', label: 'Name', description: 'Public name',
			status: { type: 'error', message: 'Required' }, width: 240, isRequired: true })
		try {
			const labels = env.all().filter((node) => node.type === 'label').map((node) => node.props.text)
			expect(labels).toEqual(['Name *', 'Public name', 'Required'])
			const field = env.all().find((node) => String(node.props?.className).split(' ').includes('vx-field'))
			expect(field.props.style).toMatchObject({ width: 240, display: 'flex', flexDirection: 'column' })
			const control = env.find(component === TextInput ? 'textfield' : 'textview')
			expect(control.props.id).toBe('name')
			expect(control.props.accessibilityLabel).toBe('Name')
			expect(control.props.accessibilityHint).toBe('Public name. Required')
			expect(control.props.accessibilityState).toMatchObject({ required: true, invalid: true })
		} finally { env.root.unmount() }
	}
})

it('an enclosing AppKit Field owns text chrome and inherited state without nesting', () => {
	function Parent() {
		return <FormField label="Account" description="Use your name" isDisabled disabledMessage="Saving">
			<TextInput label="Own name" status={{ type: 'error', message: 'Missing' }} />
		</FormField>
	}
	const env = mount(Parent, {})
	try {
		expect(env.all().filter((node) => String(node.props?.className).split(' ').includes('vx-field'))).toHaveLength(1)
		expect(env.all().filter((node) => node.type === 'label').map((node) => node.props.text)).toEqual(['Account', 'Use your name'])
		expect(env.find('textfield').props.isEnabled).toBe(false)
		expect(env.find('textfield').props.accessibilityHint).toBe('Use your name. Missing. Saving')
	} finally { env.root.unmount() }
})

it('AppKit Field preserves inline CSS strings and hidden labels keep the accessible name', () => {
	function Parent() {
		return <FormField label="Secret" isLabelHidden style="width:240px;min-width:120px">
			<TextArea />
		</FormField>
	}
	const env = mount(Parent, {})
	try {
		expect(env.find('masonview').props.style).toContain('flex-direction:column')
		expect(env.find('masonview').props.style).toContain('width:240px;min-width:120px')
		expect(env.all().filter((node) => node.type === 'label')).toHaveLength(0)
		expect(env.find('textview').props.accessibilityLabel).toBe('Secret')
	} finally { env.root.unmount() }
})


it('adding standalone validation metadata retains the editing host and uncontrolled text', () => {
	for (const component of [TextInput, TextArea]) {
		const env = mount(component, { defaultValue: 'initial' })
		const type = component === TextInput ? 'textfield' : 'textview'
		try {
			const control = env.find(type)
			control.props.onTextChange('edited')
			flushUniversalSync(() => {})
			env.render({ label: 'Name', status: { type: 'error', message: 'Check name' } })
			expect(env.find(type)).toBe(control)
			expect(env.find(type).props.value).toBe('edited')
			env.render({})
			expect(env.find(type)).toBe(control)
			expect(env.find(type).props.value).toBe('edited')
		} finally { env.root.unmount() }
	}
})


it('AppKit search fields render the default/custom icon and support an icon-free field', () => {
	const env = mount(SearchInput, { placeholder: '', defaultValue: 'query', hasClear: false })
	try {
		const findIcon = () => env.all().find((node) => node.props?.className === 'vx-input-icon')
		expect(findIcon()).toBeDefined()
		expect(env.find('image')).toBeDefined()
		expect(env.find('textfield').props.returnKeyType).toBe('search')
		expect(env.find('textfield').props.placeholder).toBe('')
		env.render({ icon: false, hasClear: false })
		expect(findIcon()).toBeUndefined()
		expect(env.find('textfield').props.value).toBe('query')
		expect(env.find('textfield').props.placeholder).toBeUndefined()
		env.render({ icon: 'xplat-check', hasClear: false })
		expect(findIcon()).toBeDefined()
		expect(env.find('image')).toBeDefined()
	} finally { env.root.unmount() }
})

it('AppKit TextInput supports a caller-owned leading node and placeholder color', () => {
	const env = mount(TextInput, { startIcon: <label id="custom-leading" text="@" />, placeholderTextColor: '#aabbcc' })
	try {
		expect(env.all().find((node) => node.props?.id === 'custom-leading')?.props.text).toBe('@')
		expect(env.find('textfield').props.placeholderTextColor).toBe('#aabbcc')
	} finally { env.root.unmount() }
})


it('AppKit TextArea forwards its length limit and can remove it without replacing the host', () => {
	const env = mount(TextArea, { maxLength: 5, defaultValue: 'note' })
	try {
		const host = env.find('textview')
		expect(host.props.maxLength).toBe(5)
		env.render({ maxLength: 0 })
		expect(env.find('textview')).toBe(host)
		expect(host.props.maxLength).toBe(0)
		env.render({})
		expect(host.props.maxLength).toBeUndefined()
		expect(host.props.value).toBe('note')
	} finally { env.root.unmount() }
})


it('AppKit clear requests preserve callback order, refocus the retained input and respect controlled feedback', () => {
	for (const controlled of [false, true]) {
		const events: unknown[] = []
		const env = mount(TextInput, { defaultValue: 'query', ...(controlled ? { value: 'query' } : {}), hasClear: true,
			onChange: (value: string) => events.push(['change', value]), onClear: () => events.push(['clear']) })
		try {
			const input = env.find('textfield')
			input.window = { makeFirstResponder: (view: unknown) => events.push(['focus', view]) }
			const clear = env.all().find((node) => String(node.props?.className).split(' ').includes('vx-input-clear'))
			clear.props.onTap(); flushUniversalSync(() => {})
			expect(events).toEqual([['change', ''], ['clear'], ['focus', input]])
			expect(env.find('textfield')).toBe(input)
			expect(input.props.value).toBe(controlled ? 'query' : '')
		} finally { env.root.unmount() }
	}
})

it('AppKit search clear shares focus behavior and disabled/read-only fields hide the clear action', () => {
	const env = mount(SearchInput, { defaultValue: 'find', hasClear: true })
	try {
		const input = env.find('textfield'), focused: unknown[] = []
		input.window = { makeFirstResponder: (view: unknown) => focused.push(view) }
		const clears = () => env.all().filter((node) => String(node.props?.className).split(' ').includes('vx-input-clear'))
		clears()[0].props.onTap(); flushUniversalSync(() => {})
		expect(focused).toEqual([input])
		for (const flag of ['isDisabled', 'isReadOnly']) {
			env.render({ value: 'query', hasClear: true, [flag]: true })
			expect(clears()).toHaveLength(0)
		}
	} finally { env.root.unmount() }
})

it('AppKit clear tolerates the callback unmounting its input before refocus', () => {
	let teardown = () => {}
	const env = mount(TextInput, { defaultValue: 'query', hasClear: true, onClear: () => teardown() })
	const focused: unknown[] = []
	env.find('textfield').window = { makeFirstResponder: (view: unknown) => focused.push(view) }
	teardown = () => env.root.unmount()
	const clear = env.all().find((node) => String(node.props?.className).split(' ').includes('vx-input-clear'))
	expect(() => clear.props.onTap()).not.toThrow()
	expect(focused).toEqual([])
})

it('AppKit editable test IDs target retained fields and update/remove without changing input state or labels', () => {
	for (const [component, type] of [[TextInput, 'textfield'], [TextArea, 'textview'], [SearchInput, 'textfield']] as const) {
		const base = { id: 'profile-name', label: 'Your name', description: 'Public name', defaultValue: 'Ada', testID: 'profile.name' }
		const env = mount(component, base)
		try {
			const field = env.find(type)
			expect(field.props.testID).toBe('profile.name')
			expect(env.all().filter((node) => node.props?.testID === 'profile.name')).toEqual([field])
			field.props.onTextChange('Grace'); flushUniversalSync(() => {})
			env.render({ ...base, testID: 'profile.renamed' })
			expect(env.find(type)).toBe(field)
			expect(field.props.testID).toBe('profile.renamed')
			expect(field.props.id).toBe('profile-name')
			expect(field.props.accessibilityLabel).toBe('Your name')
			expect(field.props.value).toBe('Grace')
			const { testID, ...withoutID } = base
			env.render(withoutID)
			expect(env.find(type)).toBe(field)
			expect(field.props.testID).toBeUndefined()
			expect(field.props.value).toBe('Grace')
		} finally { env.root.unmount() }
	}
})

it('parent Field metadata does not move the AppKit identifier onto its shell or clear button', () => {
	function Named() {
		return <FormField inputID="parent-name" label="Name"><TextInput testID="profile.name" hasClear defaultValue="Ada" /></FormField>
	}
	const env = mount(Named, {})
	try {
		const field = env.find('textfield')
		expect(field.props.id).toBe('parent-name')
		expect(env.all().filter((node) => node.props?.testID === 'profile.name')).toEqual([field])
		const clear = env.all().find((node) => node.props?.accessibilityLabel === 'Clear Name')
		expect(clear).toBeDefined()
		expect(clear.props.testID).toBeUndefined()
	} finally { env.root.unmount() }
})
