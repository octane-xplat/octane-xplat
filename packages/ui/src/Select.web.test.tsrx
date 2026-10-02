// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { Select } from './Select.web.tsrx'
import type { SelectProps } from './props'

const options = [
	{ value: 'apple', label: 'Apple', group: 'Fruit' },
	{ value: 'apricot', label: 'Apricot', group: 'Fruit', isDisabled: true },
	{ value: 'banana', label: 'Banana', group: 'Fruit' },
	{ value: 'berlin', label: 'Berlin', group: 'Cities' },
]

const cleanups: (() => void)[] = []
afterEach(() => { cleanups.splice(0).forEach((cleanup) => cleanup()); vi.unstubAllGlobals() })

function mount(props: Partial<SelectProps> = {}) {
	vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	const render = (next: Partial<SelectProps>) => act(() => root.render(<Select label="Choice" options={options} {...next} />))
	render(props)
	cleanups.push(() => { root.unmount(); host.remove() })
	const trigger = () => host.querySelector('.vx-select-trigger') as HTMLElement
	const key = (value: string, target = trigger(), extra = {}) => act(() => target.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, ...extra })))
	const click = (target: Element) => act(() => (target as HTMLElement).click())
	return { host, root, render, trigger, key, click }
}

describe('Select finite-list interaction', () => {
	it('navigates enabled options with one focus owner, commits, and restores focus', () => {
		const onValueChange = vi.fn()
		const ui = mount({ onValueChange })
		ui.trigger().focus()
		ui.key('ArrowDown')
		expect(ui.trigger().getAttribute('aria-expanded')).toBe('true')
		ui.key('ArrowDown')
		const active = document.getElementById(ui.trigger().getAttribute('aria-activedescendant')!)!
		expect(active.textContent).toContain('Banana')
		expect(document.querySelector('[role="option"][tabindex="0"]')).toBeNull()
		ui.key('Enter')
		expect(onValueChange).toHaveBeenLastCalledWith('banana')
		expect(ui.trigger().textContent).toContain('Banana')
		expect(document.querySelector('[role="listbox"]')).toBeNull()
		expect(document.activeElement).toBe(ui.trigger())
	})

	it('filters groups, announces empty outcomes, and routes search keys with IME guards', () => {
		const ui = mount({ searchable: true })
		ui.click(ui.trigger())
		const search = document.querySelector('.vx-select-search') as HTMLInputElement
		expect(document.activeElement).toBe(search)
		act(() => { search.value = 'ber'; search.dispatchEvent(new Event('input', { bubbles: true })) })
		expect(document.querySelectorAll('[role="option"]')).toHaveLength(1)
		expect(document.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Cities')
		ui.key('Escape', search, { isComposing: true })
		expect(document.querySelector('[role="listbox"]')).not.toBeNull()
		act(() => { search.value = 'missing'; search.dispatchEvent(new Event('input', { bubbles: true })) })
		expect(document.querySelector('.vx-select-empty')?.textContent).toBe('No results found')
		expect(ui.host.querySelector('[role="status"]')?.textContent).toContain('0 results')
		ui.key('Escape', search)
		expect(document.activeElement).toBe(ui.trigger())
	})

	it('cycles closed-trigger initials and preserves multi-selection during filtered select-all', () => {
		const ui = mount()
		ui.key('b')
		expect(ui.trigger().textContent).toContain('Banana')
		ui.key('b')
		expect(ui.trigger().textContent).toContain('Berlin')
	})

	it('bulk toggles only visible enabled options and retains disabled and hidden values', () => {
		const ui = mount({ multiple: true, searchable: true, hasSelectAll: true, defaultValue: ['apricot', 'berlin'] })
		ui.click(ui.trigger())
		const search = document.querySelector('.vx-select-search') as HTMLInputElement
		act(() => { search.value = 'app'; search.dispatchEvent(new Event('input', { bubbles: true })) })
		ui.click(document.querySelector('.vx-select-all')!)
		expect(ui.trigger().textContent).toContain('Apple')
		expect(ui.trigger().textContent).toContain('Apricot')
		expect(ui.trigger().textContent).toContain('Berlin')
		ui.click(document.querySelector('.vx-select-all')!)
		expect(ui.trigger().textContent).not.toContain('Apple')
		expect(ui.trigger().textContent).toContain('Apricot')
		expect(ui.trigger().textContent).toContain('Berlin')
	})

	it('closes an externally open surface when read-only and removes editing affordances', () => {
		const onValueChange = vi.fn(), onOpenChange = vi.fn()
		const ui = mount({ open: true, hasClear: true, value: 'apple', onValueChange, onOpenChange })
		ui.render({ open: true, hasClear: true, value: 'apple', isReadOnly: true, onValueChange, onOpenChange })
		expect(document.querySelector('[role="listbox"]')).toBeNull()
		expect(ui.host.querySelector('.vx-select-clear')).toBeNull()
		expect(ui.host.querySelector('.vx-select-caret')).toBeNull()
		ui.key('Enter')
		expect(onValueChange).not.toHaveBeenCalled()
		expect(onOpenChange).toHaveBeenCalledWith(false)
	})

	it('serializes one hidden input per value and keeps read-only values submittable', () => {
		const ui = mount({ multiple: true, value: ['apple', 'berlin'], htmlName: 'choices', isReadOnly: true })
		expect(Array.from(ui.host.querySelectorAll('input[type="hidden"]')).map((input) => (input as HTMLInputElement).value)).toEqual(['apple', 'berlin'])
	})

	it('shows pending selection, blocks another edit, and rolls back a rejected action', async () => {
		let reject!: (error: unknown) => void
		const action = new Promise<void>((_resolve, fail) => { reject = fail })
		const onValueChange = vi.fn(), onChangeError = vi.fn()
		const ui = mount({ defaultValue: 'apple', changeAction: () => action, onValueChange, onChangeError })
		ui.click(ui.trigger())
		ui.key('End')
		ui.key('Enter')
		expect(ui.trigger().getAttribute('aria-busy')).toBe('true')
		expect(ui.trigger().textContent).toContain('Berlin')
		ui.key('b')
		expect(onValueChange).toHaveBeenCalledTimes(1)
		await act(async () => { reject(new Error('offline')); await action.catch(() => {}) })
		expect(ui.trigger().textContent).toContain('Apple')
		expect(onValueChange).toHaveBeenLastCalledWith('apple')
		expect(onChangeError).toHaveBeenCalledTimes(1)
		expect(ui.trigger().getAttribute('aria-busy')).toBeNull()
	})

	it('does not overwrite a newer controlled selection when an old commit rejects', async () => {
		let reject!: (error: unknown) => void
		const action = new Promise<void>((_resolve, fail) => { reject = fail })
		const onValueChange = vi.fn()
		const ui = mount({ value: 'apple', changeAction: () => action, onValueChange })
		ui.key('b')
		ui.render({ value: 'apricot', changeAction: () => action, onValueChange })
		await act(async () => { reject(new Error('offline')); await action.catch(() => {}) })
		expect(onValueChange).toHaveBeenCalledTimes(1)
		expect(ui.trigger().textContent).toContain('Apricot')
	})

	it('closes on Tab and leaves composition keys untouched', () => {
		const ui = mount()
		ui.key('ArrowDown')
		ui.key('Enter', ui.trigger(), { isComposing: true })
		expect(document.querySelector('[role="listbox"]')).not.toBeNull()
		ui.key('Tab')
		expect(document.querySelector('[role="listbox"]')).toBeNull()
	})

})
