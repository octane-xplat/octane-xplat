// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createRoot, useState } from 'octane'
import * as ui from './index'
import { BaseTypeahead, Token, Tokenizer, Typeahead, TypeaheadItem } from './index'
import type { SearchableItem, SearchSource } from './index'

const items: SearchableItem[] = [
	{ id: 'apple', label: 'Apple' },
	{ id: 'banana', label: 'Banana' },
]

const source: SearchSource = {
	search: (query: string) => items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
	bootstrap: () => items,
}

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

const settle = () => act(async () => { await Promise.resolve() })

describe('Typeahead family package-root boundary', () => {
	it('exposes the family through the package barrel, not BaseTypeaheadView', () => {
		expect(typeof BaseTypeahead).toBe('function')
		expect(typeof Typeahead).toBe('function')
		expect(typeof TypeaheadItem).toBe('function')
		expect(typeof Token).toBe('function')
		expect(typeof Tokenizer).toBe('function')
		expect((ui as any).BaseTypeaheadView).toBeUndefined()
	})

	it('runs the Typeahead query-select-token flow through the barrel', async () => {
		function Fixture() @{
			const [value, setValue] = useState<SearchableItem | null>(null)

			<Typeahead label="Pick" value={value} onChange={setValue} searchSource={source} debounceMs={0} />
		}

		const host = mount(<Fixture />)
		const input = host.querySelector('.vx-typeahead-input') as HTMLInputElement
		act(() => input.focus())
		act(() => { input.value = 'ban'; input.dispatchEvent(new Event('input', { bubbles: true })) })
		await settle()
		act(() => (document.querySelectorAll('[role="option"]')[0] as HTMLElement).click())
		expect(host.querySelector('.vx-typeahead-token')?.textContent).toContain('Banana')
	})

	it('adds and removes Tokenizer tokens through the barrel', async () => {
		function Fixture() @{
			const [value, setValue] = useState<SearchableItem[]>([])

			<Tokenizer label="Tags" value={value} onChange={(next) => setValue(next)} searchSource={source} debounceMs={0} />
		}

		const host = mount(<Fixture />)
		const input = host.querySelector('.vx-typeahead-input') as HTMLInputElement
		// Focusing first mirrors real interaction: the wrapper's focusin
		// listener re-renders and refreshes the dropdown anchor ref.
		act(() => input.focus())
		act(() => { input.value = 'ban'; input.dispatchEvent(new Event('input', { bubbles: true })) })
		await settle()
		act(() => (document.querySelectorAll('[role="option"]')[0] as HTMLElement).click())
		expect(host.querySelector('.vx-token')?.textContent).toContain('Banana')
		act(() => (host.querySelector('.vx-token-remove') as HTMLElement).click())
		expect(host.querySelector('.vx-token')).toBeNull()
	})
})

// Edit presentation remains with the host interaction: entering it sets the
// base query and focuses the input; Escape/blur restores the token. A second
// resolved edit-state layer would only forward this coupled interaction, so
// retain the cohesive component without adding a bypass prop.
it('enters edit mode and restores the selected token on Escape and outside blur', async () => {
	const changed = vi.fn()
	const query = vi.fn()
	const host = mount(<Typeahead label="Pick" value={items[0]} onChange={changed} onChangeQuery={query} searchSource={source} debounceMs={0} />)
	const wrapper = host.querySelector('.vx-typeahead') as HTMLElement
	const input = host.querySelector('.vx-typeahead-input') as HTMLInputElement
	expect(host.querySelector('.vx-typeahead-token')?.textContent).toContain('Apple')
	act(() => wrapper.click())
	await settle()
	expect(host.querySelector('.vx-typeahead-token')).toBeNull()
	expect(input.value).toBe('Apple')
	expect(document.activeElement).toBe(input)
	act(() => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
	expect(host.querySelector('.vx-typeahead-token')?.textContent).toContain('Apple')
	act(() => wrapper.click())
	await settle()
	act(() => input.blur())
	expect(host.querySelector('.vx-typeahead-token')?.textContent).toContain('Apple')
	expect(changed).not.toHaveBeenCalled()
	expect(query).toHaveBeenCalledWith('Apple')
})

// Overflow is measured from the actual token hosts and changes with focus and
// ResizeObserver (native leaves use layoutChanged/getActualSize). The token
// hosts, overflow badge width, focus-within and popover must share one layout
// owner. Retain this narrow host-measurement exception without a count override;
// jsdom geometry here verifies mapping, not pixel layout or native measurement.
it('measures collapsed overflow, expands on focus, remeasures on resize and cleans up', async () => {
	let resize!: () => void
	const disconnect = vi.fn()
	vi.stubGlobal('ResizeObserver', class {
		constructor(callback: () => void) { resize = callback }
		observe() {}
		disconnect = disconnect
	})

	const host = mount(<Tokenizer label="Tags" value={items} onChange={() => {}} searchSource={source} tokenOverflowBehavior="unfocusedInline" debounceMs={0} />)
	const wrapper = host.querySelector('.vx-tokenizer') as HTMLElement
	const tokens = host.querySelectorAll('.vx-tokenizer-token')
	Object.defineProperty(wrapper, 'clientWidth', { configurable: true, value: 100 })
	tokens.forEach((token, index) => {
		Object.defineProperty(token, 'offsetLeft', { configurable: true, value: index * 60 })
		Object.defineProperty(token, 'offsetWidth', { configurable: true, value: 50 })
	})

	act(() => resize())
	expect(host.querySelector('.vx-tokenizer-overflow')?.textContent).toBe('+1 more')
	const input = host.querySelector('.vx-typeahead-input') as HTMLInputElement
	act(() => input.focus())
	await settle()
	expect(wrapper.classList.contains('vx-tokenizer--truncated')).toBe(false)
	expect(host.querySelector('.vx-tokenizer-overflow')).toBeNull()
	act(() => input.blur())
	await settle()
	expect(host.querySelector('.vx-tokenizer-overflow')?.textContent).toBe('+1 more')
	Object.defineProperty(wrapper, 'clientWidth', { configurable: true, value: 200 })
	act(() => resize())
	expect(host.querySelector('.vx-tokenizer-overflow')?.textContent).toBe('')
	cleanups.splice(0).forEach((cleanup) => cleanup())
	expect(disconnect).toHaveBeenCalled()
})
