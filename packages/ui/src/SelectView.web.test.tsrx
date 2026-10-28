// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { SelectView } from './SelectView.web.tsrx'
import type { SelectOption } from './props'
import type { SelectViewProps } from './select-view'
import { filterSelectOptions, groupSelectOptions } from './select-options'

const options: SelectOption[] = [
	{ value: 'apple', label: 'Apple', group: 'Fruit' },
	{ value: 'apricot', label: 'Apricot', group: 'Fruit', isDisabled: true },
	{ value: 'banana', label: 'Banana', group: 'Fruit' },
	{ value: 'berlin', label: 'Berlin', group: 'Cities' },
]

const cleanups: (() => void)[] = []
afterEach(() => {
	cleanups.splice(0).forEach((cleanup) => cleanup())
	vi.unstubAllGlobals()
})

/** Resolved-state fixtures mirror what `useSelect` hands the view: groups,
 *  shown, and enabled come from the real option helpers so the matrix stays
 *  honest. Intents default to spies; resolved fields take overrides. */
function fixture(overrides: Partial<SelectViewProps> = {}): SelectViewProps {
	const query = overrides.query ?? ''
	const groups =
		overrides.groups ?? groupSelectOptions(filterSelectOptions(overrides.options ?? options, query))

	const shown = overrides.shown ?? groups.flatMap((group) => group.options)
	return {
		label: 'Choice',
		options,
		open: false,
		query,
		selected: [],
		groups,
		shown,
		enabled: shown.filter((option) => !option.isDisabled),
		selectAllState: 'unchecked',
		pending: false,
		triggerText: '',
		emptyText: 'No options',
		announcement: '',
		onOpenChange: vi.fn(),
		onQueryChange: vi.fn(),
		onPick: vi.fn(),
		onClear: vi.fn(),
		onSelectAll: vi.fn(),
		...overrides,
	}
}

function mount(props: SelectViewProps) {
	vi.stubGlobal(
		'matchMedia',
		vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
	)

	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	act(() => root.render(<SelectView {...props} />))
	const unmount = () => {
		root.unmount()
		host.remove()
	}

	cleanups.push(unmount)
	const trigger = () => host.querySelector('.vx-select-trigger') as HTMLElement
	const click = (target: Element) => act(() => (target as HTMLElement).click())
	return { host, props, trigger, click, unmount }
}

describe('SelectView resolved-state fixtures', () => {
	it('renders a closed placeholder trigger without a listbox', () => {
		const ui = mount(fixture({ triggerText: 'Pick a fruit' }))
		expect(ui.trigger().getAttribute('aria-expanded')).toBe('false')
		expect(ui.trigger().textContent).toContain('Pick a fruit')
		expect(ui.host.querySelector('.vx-select-placeholder')).not.toBeNull()
		expect(ui.host.querySelector('.vx-select-caret')).not.toBeNull()
		expect(document.querySelector('[role="listbox"]')).toBeNull()
	})

	it('renders a closed selected value with clear affordance and hidden inputs', () => {
		const ui = mount(
			fixture({
				selected: ['apple'],
				triggerText: 'Apple',
				hasClear: true,
				multiple: true,
				htmlName: 'choices',
			}),
		)

		expect(ui.trigger().textContent).toContain('Apple')
		expect(ui.host.querySelector('.vx-select-placeholder')).toBeNull()
		expect(ui.host.querySelector('.vx-select-clear')).not.toBeNull()
		expect(
			Array.from(ui.host.querySelectorAll('input[type="hidden"]')).map(
				(input) => (input as HTMLInputElement).value,
			),
		).toEqual(['apple'])
	})

	it('renders the open listbox with groups, selected marks, and the resolved highlight', () => {
		const ui = mount(fixture({ open: true, selected: ['apple'], activeValue: 'banana' }))
		const options = document.querySelectorAll('[role="option"]')
		expect(options).toHaveLength(4)
		expect(document.querySelectorAll('[role="group"]')).toHaveLength(2)
		expect(document.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Fruit')
		expect(document.querySelector('.vx-select-option--on')?.textContent).toContain('Apple')
		const highlighted = document.querySelector('.vx-select-option--highlighted')!
		expect(highlighted.textContent).toContain('Banana')
		expect(highlighted.getAttribute('aria-selected')).toBe('false')
		expect(ui.trigger().getAttribute('aria-activedescendant')).toBe(highlighted.id)
	})

	it('renders filtered query state with group reduction', () => {
		mount(fixture({ open: true, searchable: true, query: 'ber', emptyText: 'No results found' }))
		const search = document.querySelector('.vx-select-search') as HTMLInputElement
		expect(search.value).toBe('ber')
		expect(document.querySelectorAll('[role="option"]')).toHaveLength(1)
		expect(document.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Cities')
	})

	it('renders the no-results query state', () => {
		mount(
			fixture({
				open: true,
				searchable: true,
				query: 'zzz',
				emptyText: 'No results found',
				announcement: '0 results. No results found',
			}),
		)

		expect(document.querySelectorAll('[role="option"]')).toHaveLength(0)
		expect(document.querySelector('.vx-select-empty')?.textContent).toBe('No results found')
	})

	it('renders the pending commit as busy and inert', () => {
		const ui = mount(
			fixture({
				open: true,
				selected: ['berlin'],
				pending: true,
				hasClear: true,
				multiple: true,
				hasSelectAll: true,
			}),
		)

		expect(ui.trigger().getAttribute('aria-busy')).toBe('true')
		expect(ui.trigger().className).toContain('vx-select--loading')
		expect(ui.host.querySelector('.vx-select-clear')?.hasAttribute('disabled')).toBe(true)
		expect((document.querySelector('.vx-select-all') as HTMLButtonElement).disabled).toBe(true)
		document.querySelectorAll('[role="option"]').forEach((option) => {
			expect(option.getAttribute('aria-disabled')).toBe('true')
		})
	})

	it('renders disabled and read-only controls without editing affordances', () => {
		const disabled = mount(fixture({ isDisabled: true }))
		expect(disabled.trigger().getAttribute('aria-disabled')).toBe('true')
		expect(disabled.trigger().className).toContain('vx-select--disabled')
		disabled.unmount()

		const readonly = mount(fixture({ isReadOnly: true, selected: ['apple'], triggerText: 'Apple' }))
		expect(readonly.trigger().getAttribute('aria-readonly')).toBe('true')
		expect(readonly.trigger().getAttribute('role')).toBe('combobox')
		expect(readonly.host.querySelector('.vx-select-caret')).toBeNull()
		readonly.unmount()
	})

	it('renders multiple select-all states deterministically', () => {
		const indeterminate = mount(
			fixture({
				open: true,
				multiple: true,
				hasSelectAll: true,
				selected: ['apple'],
				selectAllState: 'indeterminate',
			}),
		)

		expect(document.querySelector('.vx-select-all')?.getAttribute('aria-pressed')).toBe('mixed')
		indeterminate.unmount()

		mount(
			fixture({
				open: true,
				multiple: true,
				hasSelectAll: true,
				selected: ['apple', 'banana', 'berlin'],
				selectAllState: 'checked',
			}),
		)

		expect(document.querySelector('.vx-select-all')?.getAttribute('aria-pressed')).toBe('true')
	})

	it('renders field status and size treatments', () => {
		const ui = mount(fixture({ status: { type: 'error', message: 'Required' }, size: 'sm' }))
		expect(ui.trigger().getAttribute('aria-invalid')).toBe('true')
		expect(ui.trigger().className).toContain('vx-select--status-error')
		expect(ui.trigger().className).toContain('vx-select--size-sm')
	})
})

describe('SelectView intent wiring', () => {
	it('reports open, pick, and query intents without deciding them', () => {
		const closed = mount(fixture())
		closed.click(closed.trigger())
		expect(closed.props.onOpenChange).toHaveBeenCalledWith(true)
		closed.unmount()

		const picking = mount(fixture({ open: true }))
		picking.click(document.querySelectorAll('[role="option"]')[2])
		expect(picking.props.onPick).toHaveBeenCalledWith(options[2])
		expect(document.querySelector('[role="listbox"]')).not.toBeNull()
		picking.unmount()

		const searching = mount(fixture({ open: true, searchable: true }))
		const search = document.querySelector('.vx-select-search') as HTMLInputElement
		act(() => {
			search.value = 'ap'
			search.dispatchEvent(new Event('input', { bubbles: true }))
		})

		expect(searching.props.onQueryChange).toHaveBeenCalledWith('ap')
	})

	it('reports clear and select-all intents', () => {
		const clearing = mount(fixture({ selected: ['apple'], hasClear: true, multiple: true }))
		clearing.click(clearing.host.querySelector('.vx-select-clear')!)
		expect(clearing.props.onClear).toHaveBeenCalledTimes(1)

		const all = mount(fixture({ open: true, multiple: true, hasSelectAll: true }))
		all.click(document.querySelector('.vx-select-all')!)
		expect(all.props.onSelectAll).toHaveBeenCalledTimes(1)
	})
})
