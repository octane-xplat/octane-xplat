import { describe, expectTypeOf, it } from 'vitest'
import type { TableColumn, TableProps } from './props'

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
			((row: Row, column: TableColumn<'name' | 'qty'>, rowIndex: number) => any) | undefined
		>()
	})
})
