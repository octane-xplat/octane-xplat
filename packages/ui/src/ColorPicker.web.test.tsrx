// @vitest-environment jsdom
import { act, createRoot } from 'octane'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ColorPicker } from './ColorPicker.web.tsrx'
import { ColorArea } from './ColorArea.web.tsrx'
import { ColorSlider } from './ColorSlider.web.tsrx'
import { ColorSwatch } from './ColorSwatch.web.tsrx'
import { ColorField } from './ColorField.web.tsrx'
import type { ColorPickerProps } from './props'

const cleanups: (() => void)[] = []
afterEach(() => { for (const cleanup of cleanups.splice(0)) cleanup() })

function mount<P extends object>(component: (p: P) => any, props: P) {
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	const render = (next: P) => act(() => root.render(component, next))
	render(props)
	cleanups.push(() => { act(() => root.unmount()); host.remove() })
	return { render, host }
}

// jsdom has no layout; useMeasure reads getBoundingClientRect once at
// mount, so stub it on the prototype before mounting.
const realGBCR = Element.prototype.getBoundingClientRect
beforeEach(() => {
	Element.prototype.getBoundingClientRect = function () {
		return { x: 0, y: 0, left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 } as DOMRect
	}
})
afterEach(() => {
	Element.prototype.getBoundingClientRect = realGBCR
})

function pan(el: Element, steps: [number, number, 'began' | 'moved' | 'ended'][]) {
	for (const [x, y, phase] of steps) {
		const type = phase === 'began' ? 'pointerdown' : phase === 'moved' ? 'pointermove' : 'pointerup'
		act(() => el.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true })))
	}
}

it('uncontrolled ColorPicker drags hue and reports onChange/onChangeEnd', () => {
	const change = vi.fn(), end = vi.fn()
	const { host } = mount(ColorPicker, { onChange: change, onChangeEnd: end } as ColorPickerProps)
	const slider = host.querySelectorAll('[role="slider"]')[1] as HTMLElement
	pan(slider, [[0, 0, 'began'], [50, 0, 'moved'], [50, 0, 'ended']])
	expect(end).toHaveBeenCalled()
})

it('area keyboard steps saturation and brightness', () => {
	const change = vi.fn(), end = vi.fn()
	const { host } = mount(ColorArea, { defaultValue: '#ff0000', onChange: change, onChangeEnd: end })
	const area = host.querySelector('[role="slider"]') as HTMLElement
	area.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }))
	expect(change).toHaveBeenCalledWith('#ff0303')
	expect(end).toHaveBeenCalledWith('#ff0303')
})

it('hue slider keyboard steps 1° and Shift steps 10°', () => {
	const change = vi.fn()
	const { host } = mount(ColorSlider, { channel: 'hue', defaultValue: '#ff0000', onChange: change })
	const slider = host.querySelector('[role="slider"]') as HTMLElement
	act(() => slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })))
	expect(change).toHaveBeenLastCalledWith('#ff0400')
	act(() => slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true, cancelable: true })))
	expect(change).toHaveBeenLastCalledWith('#ff2f00')
})

it('controlled value resyncs the parts', () => {
	const { host, render } = mount(ColorPicker, { value: '#ff0000' } as ColorPickerProps)
	render({ value: '#0000ff' } as ColorPickerProps)
	expect(host.querySelector('.vx-color-swatch')!.getAttribute('style')).toContain('rgb(0, 0, 255)')
})

it('field commits valid hex and restores on invalid', () => {
	const change = vi.fn(), end = vi.fn()
	const { host } = mount(ColorField, { defaultValue: '#ff0000', onChange: change, onChangeEnd: end })
	const input = host.querySelector('input')!
	act(() => { input.value = '#00ff00'; input.dispatchEvent(new InputEvent('input', { bubbles: true })) })
	act(() => input.dispatchEvent(new FocusEvent('focusout', { bubbles: true })))
	expect(change).toHaveBeenCalledWith('#00ff00')
	expect(end).toHaveBeenCalledWith('#00ff00')
	act(() => { input.value = 'garbage'; input.dispatchEvent(new InputEvent('input', { bubbles: true })) })
	act(() => input.dispatchEvent(new FocusEvent('focusout', { bubbles: true })))
	expect(change).toHaveBeenCalledTimes(1)
	expect(input.value).toBe('#00ff00')
})

it('isDisabled ignores pointer and keyboard input', () => {
	const change = vi.fn()
	const { host } = mount(ColorSlider, { channel: 'hue', defaultValue: '#ff0000', isDisabled: true, onChange: change })
	const slider = host.querySelector('[role="slider"]') as HTMLElement
	pan(slider, [[0, 0, 'began'], [50, 0, 'moved'], [50, 0, 'ended']])
	act(() => slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })))
	expect(change).not.toHaveBeenCalled()
	expect(slider.tabIndex).toBe(-1)
})

it('dragging brightness to 0 and back keeps the hue', () => {
	const change = vi.fn()
	const { host } = mount(ColorArea, { defaultValue: '#ff0000', onChange: change })
	const area = host.querySelector('[role="slider"]') as HTMLElement
	// Drag down past the bottom → b:0 black; back up → hue still red.
	pan(area, [[50, 50, 'began'], [50, 150, 'moved'], [50, 150, 'ended']])
	expect(change).toHaveBeenLastCalledWith('#000000')
	pan(area, [[50, 150, 'began'], [50, 0, 'moved'], [50, 0, 'ended']])
	expect(change).toHaveBeenLastCalledWith('#ff0000')
})

it('swatch shows the hex chip and role img', () => {
	const { host } = mount(ColorSwatch, { color: '#F80' })
	const chip = host.querySelector('[role="img"]') as HTMLElement
	expect(chip.getAttribute('aria-label')).toBe('#ff8800')
})
