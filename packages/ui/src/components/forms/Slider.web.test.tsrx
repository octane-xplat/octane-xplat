// @vitest-environment jsdom
import { act, createRoot } from 'octane'
import { afterEach, expect, it, vi } from 'vitest'
import { Slider } from './Slider.web.tsrx'
import type { SliderProps } from '../../props'

const cleanups: (() => void)[] = []
afterEach(() => {
	for (const cleanup of cleanups.splice(0)) {
		cleanup()
	}
})

function mount(props: SliderProps) {
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	const render = (next: SliderProps) => act(() => root.render(Slider, next))
	render(props)
	cleanups.push(() => {
		act(() => root.unmount())
		host.remove()
	})

	return { render, slider: host.querySelector('[role="slider"]') as HTMLElement }
}

function key(slider: HTMLElement, name: string) {
	const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true })
	act(() => slider.dispatchEvent(event))
	return event
}

it('provides a tab stop and semantic bounds with the controlled value', () => {
	const { slider } = mount({ value: 0.5, minValue: 0, maxValue: 1 })
	expect(slider.tabIndex).toBe(0)
	slider.focus()
	expect(document.activeElement).toBe(slider)
	expect(slider.getAttribute('aria-valuemin')).toBe('0')
	expect(slider.getAttribute('aria-valuemax')).toBe('1')
	expect(slider.getAttribute('aria-valuenow')).toBe('0.5')
})

it.each([
	['ArrowRight', 0.51],
	['ArrowUp', 0.51],
	['ArrowLeft', 0.49],
	['ArrowDown', 0.49],
	['Home', 0],
	['End', 1],
] as const)('reports %s through the controlled callback', (name, expected) => {
	const change = vi.fn()
	const { slider } = mount({ value: 0.5, minValue: 0, maxValue: 1, onValueChange: change })
	expect(key(slider, name).defaultPrevented).toBe(true)
	expect(change).toHaveBeenCalledWith(expected)
	expect(slider.getAttribute('aria-valuenow')).toBe('0.5')
})

it('bounds adjustments and accepts the next controlled value', () => {
	const change = vi.fn()
	const { slider, render } = mount({
		value: 0.995,
		minValue: 0,
		maxValue: 1,
		onValueChange: change,
	})

	key(slider, 'ArrowUp')
	expect(change).toHaveBeenLastCalledWith(1)
	render({ value: 0.005, minValue: 0, maxValue: 1, onValueChange: change })
	key(slider, 'ArrowDown')
	expect(change).toHaveBeenLastCalledWith(0)
	render({ value: 0, minValue: 0, maxValue: 1, onValueChange: change })
	expect(slider.getAttribute('aria-valuenow')).toBe('0')
	key(slider, 'ArrowDown')
	expect(change).toHaveBeenCalledTimes(2)
	expect(key(slider, 'Enter').defaultPrevented).toBe(false)
})

it('skips disabled controls and ignores keyboard changes', () => {
	const change = vi.fn()
	const { slider } = mount({ value: 50, disabled: true, onValueChange: change })
	expect(slider.tabIndex).toBe(-1)
	expect(slider.getAttribute('aria-disabled')).toBe('true')
	for (const name of ['ArrowRight', 'Home', 'End']) {
		expect(key(slider, name).defaultPrevented).toBe(false)
	}

	expect(change).not.toHaveBeenCalled()
})


it('keeps fractional values in the default text readout', () => {
	const { slider } = mount({ value: 0.5, min: 0, max: 1, valueDisplay: 'text' })
	expect(slider.querySelector('.vx-slider-value')?.textContent).toBe('0.5')
})
