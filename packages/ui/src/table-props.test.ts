import { describe, expectTypeOf, it } from 'vitest'
import type { TableCellRenderProps, TableColumn, TableProps } from './props'

describe('Table schema types', () => {
	it('constrains column keys to row fields', () => {
		type Row = { name: string; qty: number }

		expectTypeOf<TableProps<Row>['columns']>().toEqualTypeOf<
			readonly TableColumn<'name' | 'qty'>[]
		>()
	})

	it('keeps the loose default usable without a row type', () => {
		expectTypeOf<TableProps['columns'][number]['key']>().toEqualTypeOf<string>()
	})

	it('threads the row type into renderCell', () => {
		type Row = { name: string; qty: number }

		expectTypeOf<TableProps<Row>['renderCell']>().toEqualTypeOf<
			((cell: TableCellRenderProps<Row>) => any) | undefined
		>()
		expectTypeOf<TableCellRenderProps<Row>>().toEqualTypeOf<{
			row: Row
			column: TableColumn<'name' | 'qty'>
			rowIndex: number
		}>()
	})

	it('rejects the old positional renderCell callback shape', () => {
		type Row = { name: string; qty: number }
		const positional = (row: Row, column: TableColumn<'name' | 'qty'>, rowIndex: number) =>
			String(row[column.key]) + rowIndex
		// @ts-expect-error renderCell now receives one named context object.
		const renderCell: NonNullable<TableProps<Row>['renderCell']> = positional
		void renderCell
	})
})
