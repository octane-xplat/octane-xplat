/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot } from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({ isIOS: false, isAndroid: true }))
// CheckboxIndicator registers <svgview> as an import side effect; the object
// driver doesn't need the real vendored SVGView.
vi.mock('./svg', () => ({}))

import { TextInput } from './TextInput.tsrx'
import { Switch } from './Switch.tsrx'
import { Checkbox } from './Checkbox.tsrx'
import { RadioGroup } from './RadioGroup.tsrx'
import { Drawer } from './Drawer.tsrx'

function setup() {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	return { container, root }
}

describe('native text input', () => {
	it('seeds defaultValue, keeps user edits internally, and reports the new string', async () => {
		const { container, root } = setup()
		const change = vi.fn()
		root.render(TextInput, { defaultValue: 'seed', onChange: change })
		const field = container.children[0].children[0]
		await vi.waitFor(() => expect(field.text).toBe('seed'))
		container.dispatchEvent(field, 'textChange', { object: field, value: 'seed-x' })
		expect(change).toHaveBeenLastCalledWith('seed-x')
		await vi.waitFor(() => expect(field.text).toBe('seed-x'))
		root.unmount()
	})

	it('controlled value wins over defaultValue and reports edits without self-applying', async () => {
		const { container, root } = setup()
		const change = vi.fn()
		root.render(TextInput, { value: 'owned', defaultValue: 'ignored', onChange: change })
		const field = container.children[0].children[0]
		await vi.waitFor(() => expect(field.text).toBe('owned'))
		container.dispatchEvent(field, 'textChange', { object: field, value: 'edited' })
		expect(change).toHaveBeenLastCalledWith('edited')
		expect(field.text).toBe('owned')
		root.unmount()
	})

	it('uncontrolled clear empties the field and reports an empty string', async () => {
		const { container, root } = setup()
		const change = vi.fn()
		const cleared = vi.fn()
		root.render(TextInput, { defaultValue: 'seed', hasClear: true, onChange: change, onClear: cleared })
		const shell = container.children[0]
		const field = shell.children[0]
		await vi.waitFor(() => expect(shell.children.length).toBe(2))
		// The object driver instance has no NSView surface — the clear handler
		// refocuses the field imperatively on a real device.
		field.focus = vi.fn()
		container.dispatchEvent(shell.children[1], 'tap', {})
		expect(change).toHaveBeenLastCalledWith('')
		expect(cleared).toHaveBeenCalled()
		await vi.waitFor(() => expect(field.text).toBe(''))
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

describe('native overlay surfaces', () => {
	it('Drawer seeds defaultOpen and closes itself on backdrop tap', () => {
		const { container, root } = setup()
		const dismiss = vi.fn()
		root.render(Drawer, { defaultOpen: true, onDismiss: dismiss, main: 'Main', drawer: 'Drawer' })
		const host = container.children[0]
		expect(host.children.length).toBe(3)
		container.dispatchEvent(host.children[1], 'tap', {})
		expect(dismiss).toHaveBeenCalled()
		expect(host.children.length).toBe(1)
		root.unmount()
	})
})
