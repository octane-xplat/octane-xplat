// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { BaseTypeaheadView } from './BaseTypeaheadView.web.tsrx'
import { BusyLaneProvider, createBusyIndicatorLane } from './busy-lane'
import type { SearchableItem } from './props'
import type { BaseTypeaheadViewProps } from './typeahead-view'

const items: SearchableItem[] = [
	{ id: 'apple', label: 'Apple', auxiliaryData: { group: 'Fruit' } },
	{ id: 'banana', label: 'Banana', auxiliaryData: { group: 'Fruit' } },
	{ id: 'berlin', label: 'Berlin', auxiliaryData: { group: 'Cities' } },
]

const cleanups: (() => void)[] = []
afterEach(() => {
	cleanups.splice(0).forEach((cleanup) => cleanup())
	vi.unstubAllGlobals()
})

/** Resolved-state fixtures mirror what the container hands the view: ids
 *  and defaults resolved, the anchor and input slot sharing one ref the
 *  view populates. Intents default to spies; resolved fields take
 *  overrides. */
function fixture(overrides: Partial<BaseTypeaheadViewProps> = {}): BaseTypeaheadViewProps {
	const props: BaseTypeaheadViewProps = {
		inputId: 'typeahead-input',
		listboxId: 'typeahead-listbox',
		panelId: 'typeahead-panel',
		inputRef: { current: null },
		anchor: { current: null },
		size: 'md',
		placeholder: 'Search…',
		query: '',
		results: [],
		open: false,
		highlightedIndex: -1,
		isSearching: false,
		hasSearched: false,
		value: null,
		emptyText: 'No results found',
		announcement: '',
		anchorWidth: 0,
		onQueryChange: vi.fn(),
		onSelect: vi.fn(),
		onOpenChange: vi.fn(),
		onInputFocus: vi.fn(),
		onInputBlur: vi.fn(),
		onHighlight: vi.fn(),
		...overrides,
	}

	// The container anchors the layer to its input slot by default.
	if (overrides.anchor === undefined && overrides.inputRef === undefined) {
		props.anchor = props.inputRef
	}

	return props
}

function mount(props: BaseTypeaheadViewProps, wrap?: (node: any) => any) {
	vi.stubGlobal(
		'matchMedia',
		vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
	)

	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	const view = <BaseTypeaheadView {...props} />
	act(() => root.render(wrap ? wrap(view) : view))
	const unmount = () => {
		root.unmount()
		host.remove()
	}

	cleanups.push(unmount)
	const input = () => host.querySelector('.vx-typeahead-input') as HTMLInputElement
	const key = (key: string, init: KeyboardEventInit = {}) =>
		act(() => {
			input().dispatchEvent(
				new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }),
			)
		})

	const click = (target: Element) => act(() => (target as HTMLElement).click())
	return { host, props, input, key, click, unmount }
}

describe('BaseTypeaheadView resolved-state fixtures', () => {
	it('renders a closed empty input without a listbox', () => {
		const ui = mount(fixture())
		expect(ui.input().getAttribute('aria-expanded')).toBe('false')
		expect(ui.input().getAttribute('role')).toBe('combobox')
		expect(ui.input().placeholder).toBe('Search…')
		expect(document.querySelector('[role="listbox"]')).toBeNull()
	})

	it('renders the open listbox with groups and the resolved highlight', () => {
		const ui = mount(fixture({ open: true, results: items, highlightedIndex: 1 }))
		const options = document.querySelectorAll('[role="option"]')
		expect(options).toHaveLength(3)
		expect(document.querySelectorAll('[role="group"]')).toHaveLength(2)
		const highlighted = document.querySelector('.vx-typeahead-option--highlighted')!
		expect(highlighted.textContent).toContain('Banana')
		expect(ui.input().getAttribute('aria-activedescendant')).toBe(highlighted.id)
		expect(highlighted.id).toContain('typeahead-listbox')
	})

	it('marks the controlled selection on its row', () => {
		mount(fixture({ open: true, results: items, value: items[0] }))
		const selected = document.querySelector('.vx-typeahead-option--selected')!
		expect(selected.textContent).toContain('Apple')
		expect(selected.getAttribute('aria-selected')).toBe('true')
		expect(selected.querySelector('.vx-typeahead-option-check')).not.toBeNull()
	})

	it('renders custom option content through renderItem', () => {
		mount(fixture({ open: true, results: items, renderItem: (item) => <em>{item.label}!</em> }))
		expect(document.querySelector('[role="option"] em')?.textContent).toBe('Apple!')
	})

	it('renders the empty state only after a completed search', () => {
		mount(fixture({ open: true, hasSearched: true }))
		expect(document.querySelector('.vx-typeahead-empty')?.textContent).toBe('No results found')
		expect(document.querySelectorAll('[role="option"]')).toHaveLength(1)
	})

	it('renders no empty state before a search completes', () => {
		mount(fixture({ open: true }))
		expect(document.querySelector('.vx-typeahead-empty')).toBeNull()
		expect(document.querySelectorAll('[role="option"]')).toHaveLength(0)
	})

	it('paints its own busy indicator while searching without a lane', () => {
		const ui = mount(fixture({ open: true, isSearching: true }))
		expect(ui.input().getAttribute('aria-busy')).toBe('true')
		expect(ui.host.querySelector('.vx-typeahead-loading')).not.toBeNull()
	})

	it('defers the busy indicator to a BusyLane owner', () => {
		const lane = createBusyIndicatorLane()
		const ui = mount(fixture({ open: true, isSearching: true }), (node) => (
			<BusyLaneProvider value={lane}>{node}</BusyLaneProvider>
		))

		expect(ui.host.querySelector('.vx-typeahead-loading')).toBeNull()
	})

	it('renders disabled and focusable-disabled controls without editing', () => {
		const disabled = mount(fixture({ isDisabled: true }))
		expect(disabled.input().disabled).toBe(true)
		expect(disabled.input().className).toContain('vx-typeahead-input--disabled')
		disabled.unmount()

		const focusable = mount(fixture({ isDisabled: true, isFocusableDisabled: true }))
		expect(focusable.input().disabled).toBe(false)
		expect(focusable.input().readOnly).toBe(true)
		expect(focusable.input().getAttribute('aria-disabled')).toBe('true')
	})

	it('renders the announcement in the live region', () => {
		mount(fixture({ open: true, results: items, announcement: '3 results' }))
		expect(document.querySelector('.vx-sr-only')?.textContent).toBe('3 results')
	})

	it('normalizes an out-of-range highlight instead of painting one', () => {
		const ui = mount(fixture({ open: true, results: items, highlightedIndex: 9 }))
		expect(document.querySelector('.vx-typeahead-option--highlighted')).toBeNull()
		expect(ui.input().getAttribute('aria-activedescendant')).toBeNull()
	})
})

describe('BaseTypeaheadView intent wiring', () => {
	it('reports edits as query intents without deciding them', () => {
		const ui = mount(fixture())
		act(() => {
			ui.input().value = 'ap'
			ui.input().dispatchEvent(new Event('input', { bubbles: true }))
		})

		expect(ui.props.onQueryChange).toHaveBeenCalledWith('ap')
	})

	it('reports focus and blur events', () => {
		const ui = mount(fixture())
		act(() => ui.input().focus())
		expect(ui.props.onInputFocus).toHaveBeenCalledTimes(1)
		act(() => ui.input().blur())
		expect(ui.props.onInputBlur).toHaveBeenCalledTimes(1)
	})

	it('requests the layer on closed ArrowDown only when it can open', () => {
		const empty = mount(fixture())
		empty.key('ArrowDown')
		expect(empty.props.onOpenChange).not.toHaveBeenCalled()
		empty.unmount()

		const queried = mount(fixture({ query: 'ap' }))
		queried.key('ArrowDown')
		expect(queried.props.onOpenChange).toHaveBeenCalledWith(true)
		queried.unmount()

		const entries = mount(fixture({ hasEntriesOnFocus: true }))
		entries.key('ArrowDown')
		expect(entries.props.onOpenChange).toHaveBeenCalledWith(true)
	})

	it('reports highlight navigation and selection intents', () => {
		const ui = mount(fixture({ open: true, results: items, highlightedIndex: 1 }))
		ui.key('ArrowDown')
		expect(ui.props.onHighlight).toHaveBeenLastCalledWith(2)
		ui.key('ArrowUp')
		expect(ui.props.onHighlight).toHaveBeenLastCalledWith(0)
		ui.key('End')
		expect(ui.props.onHighlight).toHaveBeenLastCalledWith(2)
		ui.key('Home')
		expect(ui.props.onHighlight).toHaveBeenLastCalledWith(0)
		ui.key('Enter')
		expect(ui.props.onSelect).toHaveBeenCalledWith(items[1])
	})

	it('reports pointer highlight and row selection', () => {
		const ui = mount(fixture({ open: true, results: items }))
		const option = document.querySelectorAll('[role="option"]')[2]
		act(() => option.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true })))
		expect(ui.props.onHighlight).toHaveBeenCalledWith(2)
		ui.click(option)
		expect(ui.props.onSelect).toHaveBeenCalledWith(items[2])
	})

	it('requests close on Escape and Tab', () => {
		const ui = mount(fixture({ open: true, results: items }))
		ui.key('Escape')
		expect(ui.props.onOpenChange).toHaveBeenLastCalledWith(false)
		ui.key('Tab')
		expect(ui.props.onOpenChange).toHaveBeenLastCalledWith(false)
	})

	it('lets the consumer keydown run first and suppress navigation', () => {
		const onKeyDown = vi.fn((event: KeyboardEvent) => event.preventDefault())
		const ui = mount(fixture({ open: true, results: items, onKeyDown }))
		ui.key('ArrowDown')
		expect(onKeyDown).toHaveBeenCalledTimes(1)
		expect(ui.props.onHighlight).not.toHaveBeenCalled()
	})

	it('leaves IME composition keys untouched', () => {
		const ui = mount(fixture({ open: true, results: items }))
		act(() => {
			ui.input().dispatchEvent(
				new KeyboardEvent('keydown', {
					key: 'Enter',
					bubbles: true,
					cancelable: true,
					isComposing: true,
				}),
			)
		})

		expect(ui.props.onSelect).not.toHaveBeenCalled()
		act(() => {
			ui.input().dispatchEvent(
				new KeyboardEvent('keydown', {
					key: 'ArrowDown',
					bubbles: true,
					cancelable: true,
					keyCode: 229,
				} as any),
			)
		})

		expect(ui.props.onHighlight).not.toHaveBeenCalled()
	})
})
