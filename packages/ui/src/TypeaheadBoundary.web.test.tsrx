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
