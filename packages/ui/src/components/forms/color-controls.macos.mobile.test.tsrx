/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { ColorSlider } from './ColorSlider.macos.tsrx'
import { ColorArea } from './ColorArea.macos.tsrx'
import { ColorPicker } from './ColorPicker.macos.tsrx'

afterEach(() => vi.unstubAllGlobals())
function mount(component: any, props: any) {
	vi.stubGlobal('__xplatAppKit', { keyboardEventsSupported: true })
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(component, next); flushUniversalSync(() => {}) }
	render(props)
	const all = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	const named = (name: string) => all().filter((node) => String(node.props?.className).split(' ').includes(name))
	return { root, render, all, named }
}
function key(host: any, name: string, extras = {}) {
	const event = { key: name, code: '', defaultPrevented: false, altKey: false, ctrlKey: false, metaKey: false,
		shiftKey: false, repeat: false, isComposing: false, preventDefault() { this.defaultPrevented = true }, stopPropagation() {}, ...extras }
	host.props.onKeyDown?.(event)
	flushUniversalSync(() => {})
	return event
}
const act = (fn: () => void) => { fn(); flushUniversalSync(() => {}) }

it('AppKit color slider exposes adjustable metadata and 10° assistive steps', () => {
	const changes: string[] = [], ends: string[] = []
	const env = mount(ColorSlider, { channel: 'hue', defaultValue: '#ff0000',
		onChange: (hex: string) => changes.push(hex), onChangeEnd: (hex: string) => ends.push(hex) })
	try {
		const slider = () => env.named('vx-color-slider')[0]
		expect(slider().props.accessibilityValue).toBe('0')
		expect(slider().props.accessibilityMinValue).toBe(0)
		expect(slider().props.accessibilityMaxValue).toBe(360)
		expect(slider().props.accessibilityValueDescription).toBe('hue 0°')
		act(() => slider().props.onAccessibilityIncrement())
		act(() => slider().props.onAccessibilityIncrement())
		expect(slider().props.accessibilityValue).toBe('20')
		expect(slider().props.accessibilityValueDescription).toBe('hue 20°')
		expect(changes).toEqual(['#ff2b00', '#ff5500'])
		expect(ends).toEqual(['#ff2b00', '#ff5500'])
		act(() => slider().props.onAccessibilityDecrement())
		act(() => slider().props.onAccessibilityDecrement())
		act(() => slider().props.onAccessibilityDecrement())
		expect(slider().props.accessibilityValue).toBe('0')
	} finally { env.root.unmount() }
})

it('AppKit color slider arrows step 1°/10° and ignore modified, composing and unrelated keys', () => {
	const env = mount(ColorSlider, { channel: 'hue', defaultValue: '#ff0000' })
	try {
		const slider = () => env.named('vx-color-slider')[0]
		expect(key(slider(), 'ArrowRight').defaultPrevented).toBe(true)
		expect(slider().props.accessibilityValue).toBe('1')
		expect(key(slider(), 'ArrowUp', { shiftKey: true }).defaultPrevented).toBe(true)
		expect(slider().props.accessibilityValue).toBe('11')
		expect(key(slider(), 'ArrowLeft').defaultPrevented).toBe(true)
		expect(slider().props.accessibilityValue).toBe('10')
		expect(key(slider(), 'ArrowRight', { metaKey: true }).defaultPrevented).toBe(false)
		expect(key(slider(), 'ArrowRight', { isComposing: true }).defaultPrevented).toBe(false)
		expect(key(slider(), 'x').defaultPrevented).toBe(false)
		expect(slider().props.accessibilityValue).toBe('10')
	} finally { env.root.unmount() }
})

it('a disabled AppKit color slider drops adjustment actions and ignores keys', () => {
	const changes: string[] = []
	const env = mount(ColorSlider, { channel: 'hue', defaultValue: '#ff0000', isDisabled: true,
		onChange: (hex: string) => changes.push(hex) })
	try {
		const slider = () => env.named('vx-color-slider')[0]
		expect(slider().props.onAccessibilityIncrement).toBeUndefined()
		expect(slider().props.onAccessibilityDecrement).toBeUndefined()
		expect(slider().props.disabled).toBe(true)
		expect(slider().props.accessibilityState).toEqual({ disabled: true })
		expect(key(slider(), 'ArrowRight').defaultPrevented).toBe(false)
		expect(slider().props.accessibilityValue).toBe('0')
		expect(changes).toEqual([])
	} finally { env.root.unmount() }
})

it('AppKit color area reports brightness and arrows move both channels with clamping', () => {
	const env = mount(ColorArea, { defaultValue: '#808080' })
	try {
		const area = () => env.named('vx-color-area')[0]
		expect(area().props.accessibilityValue).toBe('50')
		expect(area().props.accessibilityMinValue).toBe(0)
		expect(area().props.accessibilityMaxValue).toBe(100)
		expect(area().props.accessibilityValueDescription).toBe('saturation 0%, brightness 50%')
		act(() => area().props.onAccessibilityIncrement())
		expect(area().props.accessibilityValue).toBe('55')
		expect(area().props.accessibilityValueDescription).toBe('saturation 0%, brightness 55%')
		expect(key(area(), 'ArrowRight').defaultPrevented).toBe(true)
		expect(area().props.accessibilityValueDescription).toBe('saturation 1%, brightness 55%')
		expect(key(area(), 'ArrowUp', { shiftKey: true }).defaultPrevented).toBe(true)
		expect(area().props.accessibilityValue).toBe('65')
		for (let i = 0; i < 4; i++) key(area(), 'ArrowUp', { shiftKey: true })
		expect(area().props.accessibilityValue).toBe('100')
		key(area(), 'ArrowLeft'); key(area(), 'ArrowLeft')
		expect(area().props.accessibilityValueDescription).toContain('saturation 0%')
	} finally { env.root.unmount() }
})

it('the AppKit color picker slider adjusts the shared color through onChange', () => {
	const changes: string[] = []
	const env = mount(ColorPicker, { defaultValue: '#ff0000', onChange: (hex: string) => changes.push(hex) })
	try {
		act(() => env.named('vx-color-slider')[0].props.onAccessibilityIncrement())
		expect(changes).toEqual(['#ff2b00'])
	} finally { env.root.unmount() }
})
