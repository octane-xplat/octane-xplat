/** @jsxImportSource @octane-xplat/jsx */
vi.mock('../components/media/svg', () => ({
	glyphSvgMarkup: () => null,
	isSvgSrc: () => false,
	svgSource: () => null,
}))

import { describe, expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
} from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({
	// ui-svg's index.common.ts evaluates NS decorators at import.
	Property: class {
		constructor(_opts?: any) {}
		register() {}
	},
	CSSType: () => () => {},
	registerElement: () => {},
	View: class {},
	isIOS: false,
	isAndroid: true,
}))

import { ColorArea } from '../components/forms/ColorArea.tsrx'
import { ColorSlider } from '../components/forms/ColorSlider.tsrx'
import { ColorPicker } from '../components/forms/ColorPicker.tsrx'

function mount(component: any, props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	root.render(component, props)
	return { container, root, host: container.children[0] }
}

const pan = (
	container: any,
	host: any,
	events: { deltaX: number; deltaY: number; state: number }[],
) => {
	for (const e of events) {
		container.dispatchEvent(host, 'pan', { ...e, view: host })
	}
}

describe('native color suite', () => {
	it('area renders with adjustable a11y role', () => {
		const { host, root } = mount(ColorArea, {
			defaultValue: '#ff0000',
			accessibilityLabel: 'color',
		})

		expect(host.props.accessibilityRole).toBe('adjustable')
		expect(host.props.accessibilityLabel).toBe('color')
		expect(host.props.accessibilityValue).toContain('saturation 100%')
		root.unmount()
	})

	it('pan on the hue slider reports onChange + onChangeEnd', () => {
		const change = vi.fn()
		const end = vi.fn()
		const { container, host, root } = mount(ColorSlider, {
			channel: 'hue',
			defaultValue: '#ff0000',
			onChange: change,
			onChangeEnd: end,
		})

		// The object driver never lays out — give the host a size so the pan
		// math has a track width.
		host.getActualSize = () => ({ width: 100, height: 24 })
		pan(container, host, [
			{ deltaX: 0, deltaY: 0, state: 1 },
			{ deltaX: 50, deltaY: 0, state: 2 },
			{ deltaX: 50, deltaY: 0, state: 3 },
		])

		expect(change).toHaveBeenCalled()
		expect(end).toHaveBeenCalled()
		root.unmount()
	})

	it('picker mounts area + hue slider + swatch + field', () => {
		const { container, root } = mount(ColorPicker, { defaultValue: '#00ff00' })
		expect(container.children.length).toBeGreaterThan(0)
		root.unmount()
	})

	it('isDisabled ignores pan', () => {
		const change = vi.fn()
		const { container, host, root } = mount(ColorSlider, {
			channel: 'hue',
			defaultValue: '#ff0000',
			isDisabled: true,
			onChange: change,
		})

		pan(container, host, [
			{ deltaX: 0, deltaY: 0, state: 1 },
			{ deltaX: 50, deltaY: 0, state: 2 },
			{ deltaX: 50, deltaY: 0, state: 3 },
		])

		expect(change).not.toHaveBeenCalled()
		root.unmount()
	})
})
