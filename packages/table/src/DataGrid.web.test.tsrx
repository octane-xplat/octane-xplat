// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createRoot, useState } from 'octane'
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
		expect(document.getElementById('grid-select-page')!.getAttribute('aria-checked')).toBe('true')
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


describe('DataGrid selection and row accessibility', () => {
	it('announces mixed page selection, supports Space, and disables an empty filtered page', () => {
		mount({ showRowSelection: true, showGlobalFilter: true, getRowLabel: (row: any) => row.original.name })
		const page = () => document.getElementById('grid-select-page')!
		const alice = document.getElementById('grid-select-a')!
		expect(alice.getAttribute('aria-label')).toBe('Select Alice')
		expect(alice.getAttribute('aria-description')).toBe('Row 1 of 3')
		act(() => alice.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })))
		expect(page().getAttribute('aria-checked')).toBe('mixed')
		click('grid-select-page')
		expect(page().getAttribute('aria-checked')).toBe('true')
		click('grid-select-page')
		expect(page().getAttribute('aria-checked')).toBe('false')
		input('grid-search', 'missing')
		expect(page().getAttribute('aria-disabled')).toBe('true')
		click('grid-select-page')
		expect(document.getElementById('grid-selected-count')!.textContent).toBe('0 selected')
	})

	it('uses sorted filtered ordinals with a page offset and excludes controls from the table', () => {
		mount({ showRowSelection: true, showPagination: true, showGlobalFilter: true,
			initialState: { pagination: { pageIndex: 1, pageSize: 1 }, sorting: [{ id: 'name', desc: true }] } })

		const table = document.getElementById('grid-table')!
		expect(table.getAttribute('role')).toBe('table')
		expect(table.getAttribute('aria-rowcount')).toBe('4')
		expect(table.getAttribute('aria-colcount')).toBe('3')
		expect(document.getElementById('grid-row-b')!.getAttribute('aria-rowindex')).toBe('3')
		expect(table.querySelectorAll('[role="columnheader"]')).toHaveLength(3)
		expect(table.querySelectorAll('[role="cell"]')).toHaveLength(3)
		expect(table.contains(document.getElementById('grid-clear-selection'))).toBe(false)
		input('grid-search', 'ali')
		expect(document.getElementById('grid-row-a')!.getAttribute('aria-rowindex')).toBe('2')
		expect(table.getAttribute('aria-rowcount')).toBe('2')
	})

	it('preserves caller-owned IDs through filtering, paging and data replacement, then clears them', () => {
		const changes = vi.fn()
		const el = document.createElement('div')
		document.body.append(el)
		const root = createRoot(el)
		roots.push(root)
		function Owner() {
			const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({ absent: true })
			const [rows, setRows] = useState(data)
			return <>
				<button id="replace" onClick={() => setRows([...data].reverse())}>Replace</button>
				<DataGrid id="grid" data={rows} columns={columns} getRowId={(row) => row.id}
					showRowSelection showGlobalFilter showPagination
					initialState={{ pagination: { pageIndex: 0, pageSize: 2 } }}
					state={{ rowSelection }} options={{ enableRowSelection: (row) => row.id !== 'b',
						onRowSelectionChange: (updater) => { changes(updater); setRowSelection(updater) } }} />
			</>
		}

		act(() => root.render(<Owner />))
		click('grid-select-page')
		expect(document.getElementById('grid-selected-count')!.textContent).toBe('2 selected')
		input('grid-search', 'char')
		click('grid-select-page')
		expect(document.getElementById('grid-selected-count')!.textContent).toBe('3 selected')
		click('grid-select-page')
		expect(document.getElementById('grid-selected-count')!.textContent).toBe('2 selected')
		input('grid-search', '')
		click('grid-next')
		click('replace')
		click('grid-previous')
		expect(document.getElementById('grid-select-b')!.getAttribute('aria-checked')).toBe('false')
		click('grid-clear-selection')
		expect(document.getElementById('grid-selected-count')!.textContent).toBe('0 selected')
		expect(changes).toHaveBeenCalledTimes(4)
	})

	it('keeps a controlled snapshot read-only until its owner publishes the updater', () => {
		const changed = vi.fn()
		mount({ showRowSelection: true, state: { rowSelection: {} }, options: { onRowSelectionChange: changed } })
		click('grid-select-a')
		expect(changed.mock.calls[0][0]({})).toEqual({ a: true })
		expect(document.getElementById('grid-select-a')!.getAttribute('aria-checked')).toBe('false')
	})

	it.each([[-1, undefined], [101, 100]])('describes manual server pages with total %s', (expected, rowCount) => {
		mount({ showRowSelection: true, state: { pagination: { pageIndex: 3, pageSize: 10 } },
			options: { manualPagination: true, rowCount, pageCount: -1 } })

		expect(document.getElementById('grid-table')!.getAttribute('aria-rowcount')).toBe(String(expected))
		expect(document.getElementById('grid-row-a')!.getAttribute('aria-rowindex')).toBe('32')
		expect(document.getElementById('grid-select-a')!.getAttribute('aria-description')).toBe(rowCount == null ? 'Row 31' : 'Row 31 of 100')
	})
})
