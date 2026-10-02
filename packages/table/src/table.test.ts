import { describe, expect, it } from 'vitest'
import { createTable } from './table'

const DATA = [
	{ name: 'Charlie', n: 3 },
	{ name: 'Alice', n: 1 },
	{ name: 'Bob', n: 2 },
]

const columns = [
	{ accessorKey: 'name', header: 'Name' },
	{ accessorKey: 'n', header: 'N' },
]

const names = (table: any) => table.getRowModel().rows.map((r: any) => r.original.name)

describe('createTable', () => {
	it('builds the core row model in data order', () => {
		const table = createTable({ data: DATA, columns })
		expect(names(table)).toEqual(['Charlie', 'Alice', 'Bob'])
		expect(table.getHeaderGroups().map((g: any) => g.headers.map((h: any) => h.column.id))).toEqual(
			[['name', 'n']],
		)
	})

	it('sorts through the sorting state slice', () => {
		const table = createTable({ data: DATA, columns })
		table.setSorting([{ id: 'name', desc: false }])
		expect(names(table)).toEqual(['Alice', 'Bob', 'Charlie'])
		table.setSorting([{ id: 'name', desc: true }])
		expect(names(table)).toEqual(['Charlie', 'Bob', 'Alice'])
		table.setSorting([])
		expect(names(table)).toEqual(['Charlie', 'Alice', 'Bob'])
	})

	it('notifies subscribers through table.store and memoizes the row model', () => {
		const table = createTable({ data: DATA, columns })
		const seen: unknown[] = []
		const sub = table.store.subscribe((s: any) => seen.push(s.sorting))
		const before = table.getRowModel()
		table.setSorting([{ id: 'name', desc: false }])
		expect(seen.at(-1)).toEqual([{ id: 'name', desc: false }])
		expect(table.getRowModel() === before).toBe(false)
		sub.unsubscribe()
	})

	it('filters via global filter', () => {
		const table = createTable({ data: DATA, columns })
		table.setGlobalFilter('ali')
		expect(names(table)).toEqual(['Alice'])
		table.setGlobalFilter('a')
		expect(names(table)).toEqual(['Charlie', 'Alice'])
	})

	it('paginates', () => {
		const table = createTable({
			data: DATA,
			columns,
			initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
		})

		expect(names(table)).toEqual(['Charlie', 'Alice'])
		table.nextPage()
		expect(names(table)).toEqual(['Bob'])
	})

	it('syncs option updates through setOptions', () => {
		const table = createTable({ data: DATA, columns })
		table.setOptions((prev: any) => ({ ...prev, data: [{ name: 'Zed', n: 9 }] }))
		expect(names(table)).toEqual(['Zed'])
	})

	it('honors controlled state slices via options.state', () => {
		const table = createTable({
			data: DATA,
			columns,
			state: { sorting: [{ id: 'n', desc: true }] },
		})

		expect(names(table)).toEqual(['Charlie', 'Bob', 'Alice'])
	})
})
