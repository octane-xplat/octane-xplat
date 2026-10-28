import { describe, expectTypeOf, it } from 'vitest'
import type { TableColumn, TableProps } from './props'

describe('Table schema types', () => {
	it('accepts columns keyed by row fields', () => {
		type Row = { name: string; qty: number }
		const columns: TableColumn<Row>[] = [
			{ key: 'name', header: 'Name' },
			{ key: 'qty', header: 'Qty', sortable: true },
		]
		expectTypeOf<TableProps<Row>['columns']>().toEqualTypeOf<TableColumn<Row>[] | undefined>()
		void columns
	})

	it('threads the row type into renderCell', () => {
		type Row = { name: string; qty: number }
		expectTypeOf<NonNullable<TableColumn<Row>['renderCell']>>().toEqualTypeOf<(item: Row) => any>()
	})

	it('keeps the loose default usable without a row type', () => {
		expectTypeOf<TableColumn['key']>().toEqualTypeOf<string>()
	})

	it('rejects the old positional renderCell callback shape', () => {
		type Row = { name: string; qty: number }
		const positional = (row: Row, column: TableColumn, rowIndex: number) =>
			String(row.name) + String(column.key) + rowIndex

		// @ts-expect-error renderCell receives the row item, not (row, column, index).
		const renderCell: NonNullable<TableColumn<Row>['renderCell']> = positional
		void renderCell
	})
})
