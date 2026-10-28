/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { PowerSearch, PowerSearchToken, PowerSearchFilterEditor } from '@octane-xplat/ui'
import { PowerSearchView } from './PowerSearchView.web.tsrx'
import {
	createPowerSearchConfig,
	createInternalConfig,
	createPowerSearchSource,
} from './power-search-config'

import type { PowerSearchViewProps } from './power-search-view'
import type { PowerSearchFilterFor } from './props'

const { config } = createPowerSearchConfig([
	{ key: 'title', type: 'string', label: 'Title' },
] as const)

const internal = createInternalConfig(config)
const filter: PowerSearchFilterFor<typeof config> = {
	field: 'title',
	operator: 'contains',
	value: { type: 'string', value: 'hello' },
}

const cleanups: (() => void)[] = []
afterEach(() => {
	cleanups.splice(0).forEach((fn) => fn())
	vi.unstubAllGlobals()
})

function mount(node: any) {
	vi.stubGlobal(
		'matchMedia',
		vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
	)

	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	act(() => root.render(node))
	cleanups.push(() => {
		root.unmount()
		host.remove()
	})

	return { host, render: (node: any) => act(() => root.render(node)) }
}

const click = (selector: string) =>
	act(() => (document.querySelector(selector) as HTMLElement).click())

const input = (selector: string, value: string) =>
	act(() => {
		const el = document.querySelector(selector) as HTMLInputElement
		el.value = value
		el.dispatchEvent(new Event('input', { bubbles: true }))
	})

function fixture(overrides: Partial<PowerSearchViewProps> = {}): PowerSearchViewProps {
	const query = overrides.query ?? ''
	return {
		config,
		internal,
		filters: [],
		query,
		results: createPowerSearchSource(internal, 10).search(query) as any[],
		editing: null,
		suggestionsOpen: false,
		onRemove: vi.fn(),
		onClear: vi.fn(),
		onQueryChange: vi.fn(),
		onInputFocus: vi.fn(),
		onDismiss: vi.fn(),
		onCancel: vi.fn(),
		onEdit: vi.fn(),
		onChoose: vi.fn(),
		onSave: vi.fn(),
		...overrides,
	}
}

it('renders resolved query/results and reports intents without changing its state', () => {
	const props = fixture({ query: 'title foo', suggestionsOpen: true })
	mount(<PowerSearchView {...props} />)
	expect((document.querySelector('.vx-power-search-input input') as HTMLInputElement).value).toBe(
		'title foo',
	)

	expect(document.querySelectorAll('.vx-power-search-result')).toHaveLength(props.results.length)
	click('.vx-power-search-result')
	expect(props.onChoose).toHaveBeenCalledWith(props.results[0])
	expect(document.querySelector('.vx-power-search-result')).not.toBeNull()
	input('.vx-power-search-input input', 'missing')
	expect(props.onQueryChange).toHaveBeenCalledWith('missing')
})

it('renders empty, loading, disabled, read-only, count and status fixtures', () => {
	const props = fixture({
		query: 'zzzzzz',
		suggestionsOpen: true,
		isLoading: true,
		resultCount: 0,
		status: { type: 'error', message: 'Offline' },
		size: 'sm',
	})

	const ui = mount(<PowerSearchView {...props} />)
	expect(document.querySelector('.vx-power-search-empty')?.textContent).toBe('No results')
	expect(ui.host.querySelector('[role="alert"]')?.textContent).toBe('Offline')
	expect(ui.host.querySelector('.vx-power-search-count')?.textContent).toBe('0')
	ui.render(
		<PowerSearchView {...fixture({ filters: [filter], isDisabled: true, isReadOnly: true })} />,
	)

	expect(ui.host.querySelector('.vx-power-search--disabled')).not.toBeNull()
	expect(ui.host.querySelector('.vx-power-search-remove')).toBeNull()
	expect((ui.host.querySelector('input') as HTMLInputElement).disabled).toBe(true)
})

it.each([-1, 0])('renders resolved create/edit editor %s and reports save/cancel', (index) => {
	const props = fixture({ editing: { filter, index } })
	mount(<PowerSearchView {...props} />)
	expect(document.querySelector('.vx-power-search-editor')).not.toBeNull()
	click('.vx-power-search-editor-actions button.vx-pressable:last-child')
	expect(props.onSave).toHaveBeenCalledWith(filter)
	click('.vx-power-search-editor-actions button.vx-pressable:first-child')
	expect(props.onCancel).toHaveBeenCalledTimes(1)
})

it('preserves package-root family imports and canonical add/edit/remove/clear transitions', () => {
	expect(PowerSearchToken).toBeTypeOf('function')
	expect(PowerSearchFilterEditor).toBeTypeOf('function')
	const onChange = vi.fn()
	const ui = mount(<PowerSearch config={config} filters={[]} onChange={onChange} />)
	input('.vx-power-search-input input', 'title hello')
	click('.vx-power-search-result')
	input('.vx-power-search-editor input', 'hello')
	click('.vx-power-search-editor-actions button.vx-pressable:last-child')
	expect(onChange).toHaveBeenLastCalledWith([filter], 'add', 0)
	expect((ui.host.querySelector('.vx-power-search-input input') as HTMLInputElement).value).toBe('')
	ui.render(<PowerSearch config={config} filters={[filter]} onChange={onChange} />)
	click('.vx-power-search-token')
	input('.vx-power-search-editor input', 'changed')
	click('.vx-power-search-editor-actions button.vx-pressable:last-child')
	expect(onChange).toHaveBeenLastCalledWith(
		[{ ...filter, value: { type: 'string', value: 'changed' } }],
		'edit',
		0,
	)

	click('.vx-power-search-remove')
	expect(onChange).toHaveBeenLastCalledWith([], 'remove', 0)
	click('.vx-power-search-row > button.vx-pressable:last-child')
	expect(onChange).toHaveBeenLastCalledWith([], 'remove', -1)
})

it('cancel retains query and filters and web retains hardcoded leaves', () => {
	const override = vi.fn(() => null),
		onChange = vi.fn()

	mount(
		<PowerSearch
			config={config}
			filters={[filter]}
			onChange={onChange}
			components={{ string: { Token: override, Editor: override } }}
		/>,
	)

	input('.vx-power-search-input input', 'title hello')
	click('.vx-power-search-result')
	click('.vx-power-search-editor-actions button.vx-pressable:first-child')
	expect(onChange).not.toHaveBeenCalled()
	expect(override).not.toHaveBeenCalled()
	expect((document.querySelector('.vx-power-search-input input') as HTMLInputElement).value).toBe(
		'title hello',
	)
})

it('preserves focus/blur handle and limits suggestions through the canonical component', () => {
	const handleRef = vi.fn(),
		onFocus = vi.fn(),
		onBlur = vi.fn()

	const ui = mount(
		<PowerSearch
			config={config}
			filters={[]}
			onChange={vi.fn()}
			handleRef={handleRef}
			onFocus={onFocus}
			onBlur={onBlur}
			maxSearchResults={1}
		/>,
	)

	const handle = handleRef.mock.calls[0][0]
	act(() => handle.focusTypeahead())
	expect(document.activeElement).toBe(ui.host.querySelector('input'))
	expect(onFocus).toHaveBeenCalledTimes(1)
	expect(document.querySelectorAll('.vx-power-search-result')).toHaveLength(1)
	act(() => handle.blurTypeahead())
	expect(onBlur).toHaveBeenCalledTimes(1)
})

it('mounts token and unsupported editor fixtures through existing leaf contracts', () => {
	const field = config.fields[0],
		operator = field.operators.find((op) => op.key === 'contains')!

	const onPress = vi.fn(),
		onRemove = vi.fn(),
		onSave = vi.fn()

	const ui = mount(
		<PowerSearchToken
			config={config}
			field={field}
			operator={operator}
			filter={filter}
			maxLength={40}
			onPress={onPress}
			onRemove={onRemove}
		/>,
	)

	expect(ui.host.textContent).toContain('hello')
	click('.vx-power-search-token')
	click('.vx-power-search-remove')
	expect(onPress).toHaveBeenCalledTimes(1)
	expect(onRemove).toHaveBeenCalledTimes(1)
	const unsupported = {
		name: 'Unsupported',
		fields: [
			{
				key: 'range',
				label: 'Range',
				operators: [{ key: 'between', label: 'between', value: { type: 'date_range' as const } }],
			},
		],
	}

	ui.render(
		<PowerSearchFilterEditor
			config={unsupported}
			filter={{ field: 'range', operator: 'between' }}
			mode="create"
			onSave={onSave}
			onCancel={vi.fn()}
		/>,
	)

	expect(ui.host.querySelector('.vx-power-search-editor-note')).not.toBeNull()
	expect(
		ui.host
			.querySelector('.vx-power-search-editor-actions button.vx-pressable:last-child')
			?.hasAttribute('disabled'),
	).toBe(true)

	expect(onSave).not.toHaveBeenCalled()
})
