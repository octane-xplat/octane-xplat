/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot } from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({ isIOS: false, isAndroid: true }))
import { Checkbox } from './Checkbox.tsrx'

describe('native checkbox selection semantics', () => {
	it('updates mixed value without claiming unchecked, restores boolean state, and blocks disabled taps', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		const change = vi.fn()
		const props = { accessibilityLabel: 'Select current page', onCheckedChange: change }
		root.render(Checkbox as any, { ...props, checked: false, indeterminate: true })
		const host = container.children[0]
		expect(host.props.accessibilityRole).toBe('checkbox')
		expect(host.props.accessibilityLabel).toBe('Select current page')
		expect(host.props.accessibilityValue).toBe('Partially selected')
		expect(host.props.accessibilityState).toBeUndefined()
		container.dispatchEvent(host, 'tap', {})
		expect(change).toHaveBeenLastCalledWith(true)
		root.render(Checkbox as any, { ...props, checked: true, indeterminate: false })
		expect(host.props.accessibilityValue).toBeUndefined()
		expect(host.props.accessibilityState).toBe('checked')
		root.render(Checkbox as any, { ...props, checked: false, indeterminate: true, isDisabled: true })
		expect(host.props.accessibilityState).toBe('disabled')
		expect(() => container.dispatchEvent(host, 'tap', {})).toThrow('no "tap" listener')
		root.render(Checkbox as any, { ...props, checked: false })
		expect(host.props.accessibilityState).toBe('unchecked')
		root.unmount()
	})
})
