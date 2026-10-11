// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { MultiSelector, Selector } from './index'
import type { MultiSelectorProps, SelectorProps } from './index'

const options = [
	{ value: 'apple', label: 'Apple' },
	{ value: 'banana', label: 'Banana' },
]

const cleanups: (() => void)[] = []
afterEach(() => { cleanups.splice(0).forEach((cleanup) => cleanup()); vi.unstubAllGlobals() })

function mount(node: any) {
	vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	act(() => root.render(node))
	cleanups.push(() => { root.unmount(); host.remove() })
	return host
}

describe('Select package-root boundary', () => {
	it('exposes Selector and MultiSelector through the package barrel, not SelectView', () => {
		const props: SelectorProps = { options }
		const multiProps: MultiSelectorProps = { options }
		expect(typeof Selector).toBe('function')
		expect(typeof MultiSelector).toBe('function')
		expect(props.options).toBe(options)
		expect(multiProps.options).toBe(options)
	})

	it('renders Selector through the package root with the canonical behavior intact', () => {
		const onValueChange = vi.fn()
		const host = mount(<Selector label="Choice" options={options} onValueChange={onValueChange} />)
		const trigger = host.querySelector('.vx-select-trigger') as HTMLElement
		trigger.focus()
		act(() => trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })))
		act(() => trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))
		expect(onValueChange).toHaveBeenLastCalledWith('apple')
		expect(trigger.textContent).toContain('Apple')
	})

	it('renders MultiSelector through the package root with multi-selection intact', () => {
		const onValueChange = vi.fn()
		const host = mount(<MultiSelector label="Choices" options={options} onValueChange={onValueChange} />)
		act(() => (host.querySelector('.vx-select-trigger') as HTMLElement).click())
		act(() => (document.querySelectorAll('[role="option"]')[1] as HTMLElement).click())
		expect(onValueChange).toHaveBeenLastCalledWith(['banana'])
	})
})
