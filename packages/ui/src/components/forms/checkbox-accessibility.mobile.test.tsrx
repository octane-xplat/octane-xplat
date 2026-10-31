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
vi.mock('../media/svg', () => ({}))
import { Checkbox } from './Checkbox.tsrx'

describe('native checkbox selection semantics', () => {
	it('updates mixed value without claiming unchecked, restores boolean state, and blocks disabled taps', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		const change = vi.fn()
		const props = { accessibilityLabel: 'Select current page', onChange: change }
		root.render(Checkbox, { ...props, value: 'indeterminate' })
		const findCheckbox = (node: any): any => {
			if (node.props?.accessibilityRole === 'checkbox') return node
			for (const child of node.children ?? []) {
				const found = findCheckbox(child)
				if (found) return found
			}
		}
		const host = findCheckbox(container.children[0])
		expect(host).toBeDefined()
		expect(host.props.accessibilityRole).toBe('checkbox')
		expect(host.props.accessibilityLabel).toBe('Select current page')
		expect(host.props.accessibilityValue).toBe('Partially selected')
		expect(host.props.accessibilityState).toBeUndefined()
		container.dispatchEvent(host, 'tap', {})
		expect(change).toHaveBeenLastCalledWith(true)
		root.render(Checkbox, { ...props, value: true })
		expect(host.props.accessibilityValue).toBeUndefined()
		expect(host.props.accessibilityState).toBe('checked')
		root.render(Checkbox, { ...props, value: 'indeterminate', isDisabled: true })
		expect(host.props.accessibilityState).toBe('disabled')
		expect(() => container.dispatchEvent(host, 'tap', {})).toThrow('no "tap" listener')
		root.render(Checkbox, { ...props, value: false })
		expect(host.props.accessibilityState).toBe('unchecked')
		root.unmount()
	})
})
