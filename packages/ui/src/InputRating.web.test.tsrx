/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { act, createRoot } from 'octane'
import { afterEach, expect, it, vi } from 'vitest'
import { InputRating } from './InputRating.web.tsrx'
import { FormField } from './FormField.web.tsrx'
import type { InputRatingProps } from './props'

const cleanups: (() => void)[] = []
afterEach(() => { for (const cleanup of cleanups.splice(0)) cleanup() })
function mount(initial: InputRatingProps) {
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	const render = (props: InputRatingProps) => act(() => root.render(InputRating, props))
	render(initial)
	cleanups.push(() => { act(() => root.unmount()); host.remove() })
	const cells = () => Array.from(host.querySelectorAll<HTMLElement>('[role="radio"]'))
	const group = () => host.querySelector<HTMLElement>('[role="radiogroup"]')!
	const key = (cell: HTMLElement, name: string) => act(() =>
		cell.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true })))
	return { host, root, render, cells, group, key }
}
it('owns one field and exactly one checked score while drawing a filled prefix', () => {
	const { host, cells, group } = mount({ label: 'Trip rating', width: 280, value: 3 })
	expect(host.querySelectorAll('.vx-field')).toHaveLength(1)
	expect(host.querySelector('.vx-field-label')?.textContent).toBe('Trip rating')
	expect(cells().filter(cell => cell.getAttribute('aria-checked') === 'true')).toEqual([cells()[2]])
	expect(cells().filter(cell => cell.classList.contains('vx-rating-cell--on'))).toHaveLength(3)
	expect(cells().map(cell => cell.getAttribute('aria-label'))).toEqual(['1 of 5', '2 of 5', '3 of 5', '4 of 5', '5 of 5'])
	expect(cells().map(cell => cell.tabIndex)).toEqual([-1, -1, 0, -1, -1])
	expect(group().getAttribute('aria-labelledby')).toBeTruthy()
})
it('retains a local score and suppresses duplicate selection', () => {
	const change = vi.fn()
	const { render, cells, key } = mount({ defaultValue: 2, onValueChange: change })
	const original = cells()
	act(() => cells()[3].click())
	expect(change).toHaveBeenLastCalledWith(4)
	expect(cells()[3].getAttribute('aria-checked')).toBe('true')
	act(() => cells()[3].click())
	expect(change).toHaveBeenCalledTimes(1)
	render({ defaultValue: 1, onValueChange: change })
	expect(cells()[3].getAttribute('aria-checked')).toBe('true')
	expect(cells()).toEqual(original)
	key(cells()[3], 'ArrowLeft')
	expect(change).toHaveBeenLastCalledWith(3)
	expect(document.activeElement).toBe(cells()[2])
})
it('keeps controlled authority and a single focus stop after rejected arrows', () => {
	const change = vi.fn()
	const { cells, key } = mount({ value: 2, onValueChange: change })
	act(() => cells()[1].focus())
	key(cells()[1], 'ArrowRight')
	expect(change).toHaveBeenLastCalledWith(3)
	expect(document.activeElement).toBe(cells()[2])
	expect(cells()[1].getAttribute('aria-checked')).toBe('true')
	expect(cells().map(cell => cell.tabIndex)).toEqual([-1, -1, 0, -1, -1])
	key(cells()[2], 'Enter')
	expect(change).toHaveBeenCalledTimes(1)
})
it('keeps read-only scores focusable without changing their value', () => {
	const change = vi.fn()
	const { cells, key, group, render } = mount({ value: 2, isReadOnly: true, onValueChange: change })
	act(() => cells()[1].focus())
	key(cells()[1], 'ArrowRight')
	expect(document.activeElement).toBe(cells()[2])
	key(cells()[2], ' ')
	expect(change).not.toHaveBeenCalled()
	expect(group().getAttribute('aria-readonly')).toBe('true')
	render({ value: 2, isDisabled: true, onValueChange: change })
	expect(cells().every(cell => !cell.hasAttribute('tabindex'))).toBe(true)
})
it('inherits an external field without a second caption or owner', () => {
	const { root, host, group } = mount({})
	act(() => root.render(<FormField label="Parent rating" isGroupLabel isReadOnly isRequired>
		<InputRating value={2} />
	</FormField>))
	expect(host.querySelectorAll('.vx-field')).toHaveLength(1)
	expect(group().getAttribute('aria-required')).toBe('true')
	expect(group().getAttribute('aria-readonly')).toBe('true')
})
it('accepts a text character and retains score cells through glyph changes', () => {
	const { cells, render } = mount({ icon: '☆', value: 2 })
	const original = cells()
	expect(cells().every(cell => cell.textContent === '☆')).toBe(true)
	render({ value: 2 })
	expect(cells().every(cell => cell.textContent === '★')).toBe(true)
	expect(cells()).toEqual(original)
})


it('uses the group direction for horizontal navigation', () => {
	const change = vi.fn()
	const { cells, key } = mount({ value: 3, style: { direction: 'rtl' }, onValueChange: change })
	act(() => cells()[2].focus())
	key(cells()[2], 'ArrowRight')
	expect(change).toHaveBeenLastCalledWith(2)
	expect(document.activeElement).toBe(cells()[1])
})
