// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { DataGrid } from './DataGrid.tsrx'

// Windowing has its own integration suite; keep these control regressions
// independent of jsdom's absent layout and ResizeObserver implementation.
vi.mock('@octane-xplat/ui', async (original) => {
	const ui = await original<any>()
	return {
		...ui,
		VirtualList: (props: any) => (
			<ui.View>
				{props.items.length
					? props.items.map((item: any, index: number) => (
							<ui.View key={props.keyExtractor(item, index)}>
								{props.renderItem(item, index)}
							</ui.View>
						))
					: props.renderEmpty?.()}
			</ui.View>
		),
	}
})

vi.stubGlobal('matchMedia', () => ({
	matches: false,
	addEventListener() {},
	removeEventListener() {},
}))

const roots: any[] = []
const data = [
	{ id: 'a', name: 'Alice', count: 1 },
	{ id: 'b', name: 'Bob', count: 2 },
	{ id: 'c', name: 'Charlie', count: 3 },
]

const columns = [
	{
		accessorKey: 'name',
		header: 'Name',
		size: 140,
		minSize: 100,
		maxSize: 180,
		enableHiding: false,
	},
	{ accessorKey: 'count', header: 'Count', size: 100 },
]

function mount(extra: any = {}) {
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	roots.push(root)
	act(() =>
		root.render(
			<DataGrid id="grid" data={data} columns={columns} getRowId={(row) => row.id} {...extra} />,
		),
	)

	return el
}

const click = (id: string) =>
	act(() => document.getElementById(id)!.dispatchEvent(new MouseEvent('click', { bubbles: true })))

const input = (id: string, text: string) =>
	act(() => {
		const el = document.getElementById(id) as HTMLInputElement
		el.value = text
		el.dispatchEvent(new Event('input', { bubbles: true }))
	})

const pan = (id: string, type: string, x: number) =>
	act(() => {
		const event = new Event(type, { bubbles: true })
		Object.assign(event, { clientX: x, clientY: 0, pointerId: 1 })
		document.getElementById(id)!.dispatchEvent(event)
	})

const names = () => [...document.querySelectorAll('[id^="grid-row-"]')].map((el) => el.textContent)

afterEach(() => {
	for (const root of roots.splice(0)) act(() => root.unmount())
	document.body.innerHTML = ''
})

describe('DataGrid controls', () => {
	it('filters and resets to the first page, pages results and changes page size', () => {
		mount({
			showGlobalFilter: true,
			showColumnFilters: true,
			showPagination: true,
			initialState: { pagination: { pageIndex: 1, pageSize: 1 } },
		})

		expect(names()).toEqual(['Bob2'])
		input('grid-search', 'ali')
		expect(names()).toEqual(['Alice1'])
		expect(document.getElementById('grid-page')!.textContent).toBe('Page 1 of 1')
		input('grid-search', '')
		click('grid-next')
		expect(names()).toEqual(['Bob2'])
		input('grid-th-name-filter', 'char')
		expect(names()).toEqual(['Charlie3'])
		input('grid-th-name-filter', '')
		click('grid-size-10')
		expect(names()).toHaveLength(3)
		input('grid-th-count-filter', '2')
		expect(names()).toEqual(['Bob2'])
	})

	it('selects only selectable page rows, preserves off-page IDs, and does not activate a row', () => {
		const press = vi.fn()
		mount({
			showRowSelection: true,
			showPagination: true,
			onRowPress: press,
			options: { enableRowSelection: (row: any) => row.id !== 'b' },
			initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
		})

		click('grid-select-a')
		expect(press).not.toHaveBeenCalled()
		expect(document.getElementById('grid-select-b')!.getAttribute('aria-disabled')).toBe('true')
		click('grid-next')
		click('grid-select-page')
		expect(document.getElementById('grid-selected-count')!.textContent).toBe('2 selected')
		click('grid-clear-selection')
		expect(document.getElementById('grid-selected-count')!.textContent).toBe('0 selected')
	})

	it('protects non-hideable columns, moves columns and resets settings', () => {
		mount({ showColumnSettings: true })
		click('grid-settings')
		expect(document.getElementById('grid-visible-name')!.getAttribute('aria-disabled')).toBe('true')
		click('grid-visible-count')
		expect(document.getElementById('grid-th-count')).toBeNull()
		click('grid-visible-count')
		click('grid-earlier-count')
		expect(names()[0]).toBe('1Alice')
		click('grid-reset-columns')
		expect(names()[0]).toBe('Alice1')
	})

	it('resizes within bounds with matching row widths and rolls back cancelled pans', () => {
		mount({ resizableColumns: true })
		const width = () =>
			(document.getElementById('grid-th-name')!.parentElement as HTMLElement).style.width

		click('grid-th-name-widen')
		expect(width()).toBe('150px')
		expect((document.querySelector('#grid-row-a .vx-table-cell') as HTMLElement).style.width).toBe(
			'150px',
		)

		pan('grid-th-name-resize', 'pointerdown', 0)
		pan('grid-th-name-resize', 'pointermove', 200)
		expect(width()).toBe('180px')
		pan('grid-th-name-resize', 'pointercancel', 200)
		expect(width()).toBe('150px')
	})

	it('reorders on release and preserves order on cancellation', () => {
		mount({ reorderableColumns: true })
		pan('grid-th-name-drag', 'pointerdown', 0)
		pan('grid-th-name-drag', 'pointermove', 200)
		pan('grid-th-name-drag', 'pointercancel', 200)
		expect(names()[0]).toBe('Alice1')
		pan('grid-th-name-drag', 'pointerdown', 0)
		pan('grid-th-name-drag', 'pointerup', 200)
		expect(names()[0]).toBe('1Alice')
	})

	it('forwards controlled callbacks without changing the owner snapshot', () => {
		const changed = vi.fn()
		mount({ state: { sorting: [] }, options: { onSortingChange: changed } })
		click('grid-th-name')
		expect(changed).toHaveBeenCalledOnce()
		expect(changed.mock.calls[0][0]([])).toEqual([{ id: 'name', desc: false }])
		expect(names()[0]).toBe('Alice1')
	})
})
