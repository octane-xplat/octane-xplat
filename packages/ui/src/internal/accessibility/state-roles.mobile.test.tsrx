/** @jsxImportSource @octane-xplat/jsx */
import { describe, expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
} from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({ isIOS: false, isAndroid: true }))
// CheckboxIndicator registers <svgview> as an import side effect; the object
// driver doesn't need the real vendored SVGView.
vi.mock('../../components/media/svg', () => ({}))

import { TextInput } from '../../components/forms/TextInput.tsrx'
import { Switch } from '../../components/forms/Switch.tsrx'
import { Checkbox } from '../../components/forms/Checkbox.tsrx'
import { RadioGroup } from '../../components/forms/RadioGroup.tsrx'

function setup() {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	return { container, root }
}

function LeadingInput(props: { inputRef: any; showLeading?: boolean }) @{
	<TextInput ref={props.inputRef} defaultValue="seed"
		startIcon={props.showLeading ? <label text="Prefix" /> : undefined} />
}

function findNative(node: any, type: string, label?: string): any {
	if (node.type === type && (label === undefined || node.props?.accessibilityLabel === label)) {
		return node
	}
	for (const child of node.children ?? []) {
		const found = findNative(child, type, label)
		if (found) return found
	}
	return null
}

describe('native text input', () => {
	it('seeds defaultValue, keeps user edits internally, and reports the new string', async () => {
		const { container, root } = setup()
		const change = vi.fn()
		root.render(TextInput, { defaultValue: 'seed', onChange: change })
		const field = findNative(container, 'textfield')
		await vi.waitFor(() => expect(field.text).toBe('seed'))
		container.dispatchEvent(field, 'textChange', { object: field, value: 'seed-x' })
		expect(change).toHaveBeenLastCalledWith('seed-x')
		await vi.waitFor(() => expect(field.text).toBe('seed-x'))
		root.unmount()
	})

	it('controlled value wins and restores repeated rejected native edits', async () => {
		const { container, root } = setup()
		const change = vi.fn()
		root.render(TextInput, { value: 'owned', defaultValue: 'ignored', onChange: change })
		const field = findNative(container, 'textfield')
		await vi.waitFor(() => expect(field.text).toBe('owned'))
		for (let attempt = 0; attempt < 2; attempt++) {
			field.text = 'edited'
			container.dispatchEvent(field, 'textChange', { object: field, value: 'edited' })
			expect(change).toHaveBeenLastCalledWith('edited')
			await vi.waitFor(() => expect(field.text).toBe('owned'))
		}
		expect(change).toHaveBeenCalledTimes(2)
		root.unmount()
	})

	it('uncontrolled clear empties the field and reports an empty string', async () => {
		const { container, root } = setup()
		const change = vi.fn()
		const cleared = vi.fn()
		root.render(TextInput, {
			defaultValue: 'seed',
			hasClear: true,
			onChange: change,
			onClear: cleared,
		})

		const field = findNative(container, 'textfield')
		const clear = findNative(container, 'masonview', 'Clear input')
		expect(clear).not.toBeNull()
		// The object driver instance has no NSView surface — the clear handler
		// refocuses the field imperatively on a real device.
		field.focus = vi.fn()
		container.dispatchEvent(clear, 'tap', {})
		expect(change).toHaveBeenLastCalledWith('')
		expect(cleared).toHaveBeenCalled()
		await vi.waitFor(() => expect(field.text).toBe(''))
		root.unmount()
	})

	it('retains an edited input while automatic labels appear and disappear', async () => {
		const { container, root } = setup()
		const change = vi.fn()
		const inputRef = { current: null as any }
		const props = { defaultValue: 'seed', onChange: change, ref: inputRef }
		root.render(TextInput, props)
		const field = findNative(container, 'textfield')
		await vi.waitFor(() => expect(field.text).toBe('seed'))
		container.dispatchEvent(field, 'textChange', { object: field, value: 'edited' })
		await vi.waitFor(() => expect(field.text).toBe('edited'))
		root.render(TextInput, { ...props, label: 'Account', description: 'Help' })
		await vi.waitFor(() => expect(findNative(container, 'textfield')).toBe(field))
		expect(inputRef.current.native).toBe(field)
		expect(field.text).toBe('edited')
		root.render(TextInput, props)
		await vi.waitFor(() => expect(findNative(container, 'textfield')).toBe(field))
		expect(field.text).toBe('edited')
		expect(change).toHaveBeenCalledExactlyOnceWith('edited')
		root.unmount()
		expect(inputRef.current).toBeNull()
	})
	it('retains the editor and handle when leading content changes', async () => {
		const { container, root } = setup()
		const inputRef = { current: null as any }
		const props = { inputRef }
		root.render(LeadingInput, props)
		const field = findNative(container, 'textfield')
		await vi.waitFor(() => expect(field.text).toBe('seed'))
		field.text = 'edited'
		container.dispatchEvent(field, 'textChange', { object: field, value: 'edited' })
		await vi.waitFor(() => expect(field.text).toBe('edited'))
		root.render(LeadingInput, { ...props, showLeading: true })
		await vi.waitFor(() => expect(findNative(container, 'textfield')).toBe(field))
		expect(inputRef.current.native).toBe(field)
		expect(field.text).toBe('edited')
		root.render(LeadingInput, props)
		await vi.waitFor(() => expect(findNative(container, 'textfield')).toBe(field))
		expect(inputRef.current.native).toBe(field)
		expect(field.text).toBe('edited')
		root.unmount()
	})
})

describe('native boolean inputs', () => {
	it('Switch seeds defaultValue and toggles internally', () => {
		const { container, root } = setup()
		const change = vi.fn()
		root.render(Switch, { defaultValue: true, onChange: change })
		const host = container.children[0]
		expect(host.props.accessibilityState).toBe('checked')
		container.dispatchEvent(host, 'tap', {})
		expect(change).toHaveBeenLastCalledWith(false)
		expect(host.props.accessibilityState).toBe('unchecked')
		root.unmount()
	})

	it('Switch controlled checked wins and stays caller-owned', () => {
		const { container, root } = setup()
		const change = vi.fn()
		root.render(Switch, { value: true, defaultValue: false, onChange: change })
		const host = container.children[0]
		expect(host.props.accessibilityState).toBe('checked')
		container.dispatchEvent(host, 'tap', {})
		expect(change).toHaveBeenLastCalledWith(false)
		expect(host.props.accessibilityState).toBe('checked')
		root.unmount()
	})

	it('Checkbox seeds defaultValue and toggles internally', () => {
		const { container, root } = setup()
		const change = vi.fn()
		root.render(Checkbox, { defaultValue: true, onChange: change })
		const host = container.children[0]
		expect(host.props.accessibilityState).toBe('checked')
		container.dispatchEvent(host, 'tap', {})
		expect(change).toHaveBeenLastCalledWith(false)
		expect(host.props.accessibilityState).toBe('unchecked')
		root.unmount()
	})

	it('Checkbox indeterminate resolves to checked on toggle', () => {
		const { container, root } = setup()
		const change = vi.fn()
		root.render(Checkbox, { value: 'indeterminate', onChange: change })
		const host = container.children[0]
		container.dispatchEvent(host, 'tap', {})
		expect(change).toHaveBeenLastCalledWith(true)
		root.unmount()
	})
})

describe('native choices', () => {
	it('RadioGroup seeds defaultValue and selects internally', () => {
		const { container, root } = setup()
		const change = vi.fn()
		const options = [
			{ value: 'a', label: 'A' },
			{ value: 'b', label: 'B' },
		]

		root.render(RadioGroup, { defaultValue: 'b', options, onValueChange: change })
		const group = container.children[0]
		expect(String(group.children[1].props.className)).toContain('vx-radio--on')
		container.dispatchEvent(group.children[0], 'tap', {})
		expect(change).toHaveBeenLastCalledWith('a')
		expect(String(group.children[0].props.className)).toContain('vx-radio--on')
		expect(String(group.children[1].props.className)).not.toContain('vx-radio--on')
		root.unmount()
	})

	it('RadioGroup controlled value wins over defaultValue', () => {
		const { container, root } = setup()
		const change = vi.fn()
		const options = [
			{ value: 'a', label: 'A' },
			{ value: 'b', label: 'B' },
		]

		root.render(RadioGroup, { value: 'b', defaultValue: 'a', options, onValueChange: change })
		const group = container.children[0]
		expect(String(group.children[1].props.className)).toContain('vx-radio--on')
		container.dispatchEvent(group.children[0], 'tap', {})
		expect(change).toHaveBeenLastCalledWith('a')
		expect(String(group.children[0].props.className)).not.toContain('vx-radio--on')
		root.unmount()
	})
})
