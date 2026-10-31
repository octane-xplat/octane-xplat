// @vitest-environment jsdom
import { act, createRoot } from 'octane'
import { afterEach, expect, it, vi } from 'vitest'
import { Slider } from './Slider.web.tsrx'
import type { SliderProps } from '../../props'

vi.mock('./useMeasure.web.tsrx', () => ({
	useMeasure: () => ({ bounds: { x: 0, y: 0, width: 200, height: 28 }, ref() {} }),
}))

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
it('seeds scalar and range defaults once and retains local keyboard edits', () => {
	const scalar = mount({ defaultValue: 40, step: 5 })
	expect(scalar.slider.getAttribute('aria-valuenow')).toBe('40')
	key(scalar.slider, 'ArrowRight')
	expect(scalar.slider.getAttribute('aria-valuenow')).toBe('45')
	scalar.render({ defaultValue: 90, step: 5 })
	expect(scalar.slider.getAttribute('aria-valuenow')).toBe('45')

	const range = mount({ defaultValue: [20, 80], step: 5 })
	expect(range.slider.querySelectorAll('.vx-slider-thumb')).toHaveLength(2)
	expect(range.slider.getAttribute('aria-valuenow')).toBe('80')
	key(range.slider, 'ArrowRight')
	expect(range.slider.getAttribute('aria-valuetext')).toBe('20 – 85')
	expect(range.slider.getAttribute('aria-valuenow')).toBe('85')
})

it('anchors stepping to the declared minimum', () => {
	const change = vi.fn()
	const { slider } = mount({ value: 3, min: 3, max: 28, step: 5, onValueChange: change })
	key(slider, 'ArrowRight')
	expect(change).toHaveBeenLastCalledWith(8)
})

it('uses the pressed position to choose the nearest range thumb', () => {
	const change = vi.fn()
	const { slider } = mount({ value: [20, 80], min: 0, max: 100, step: 5, onValueChange: change })
	const pointer = (name: string, x: number) =>
		act(() => slider.dispatchEvent(new MouseEvent(name, { clientX: x, bubbles: true })))
	pointer('pointerdown', 160)
	pointer('pointermove', 180)
	pointer('pointerup', 180)
	expect(change).toHaveBeenLastCalledWith([20, 90])
	expect(slider.getAttribute('aria-valuetext')).toBe('20 – 80')
	pointer('pointerdown', 40)
	pointer('pointermove', 80)
	pointer('pointerup', 80)
	expect(change).toHaveBeenLastCalledWith([40, 80])
})


it('shows a formatted thumb tooltip on focus and retains its live value', async () => {
	const formatValue = (value: number) => value + '%'
	const { slider, render } = mount({ value: 25, valueDisplay: 'tooltip', formatValue })
	act(() => slider.focus())
	await vi.waitFor(() => expect(document.querySelector('[role="tooltip"]')?.textContent).toBe('25%'))
	render({ value: 35, valueDisplay: 'tooltip', formatValue })
	await vi.waitFor(() => expect(document.querySelector('[role="tooltip"]')?.textContent).toBe('35%'))
	key(slider, 'Escape')
	await vi.waitFor(() => expect(document.querySelector('[role="tooltip"]')).toBeNull())
})


it('reaches the maximum when the step does not divide the interval', () => {
	const change = vi.fn()
	const { slider } = mount({ value: 21, min: 3, max: 28, step: 6, onValueChange: change })
	key(slider, 'End')
	expect(change).toHaveBeenLastCalledWith(28)
})


it('keeps read-only sliders focusable without presenting them as disabled', () => {
	const change = vi.fn()
	const { slider } = mount({ value: 50, isReadOnly: true, onValueChange: change })
	expect(slider.tabIndex).toBe(0)
	expect(slider.getAttribute('aria-readonly')).toBe('true')
	expect(slider.getAttribute('aria-disabled')).toBeNull()
	act(() => slider.focus())
	expect(document.activeElement).toBe(slider)
	key(slider, 'ArrowRight')
	key(slider, 'Home')
	expect(change).not.toHaveBeenCalled()
})
