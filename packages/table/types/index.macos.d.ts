import type { RowData, TableFeatures } from '@tanstack/table-core'
import type { DataGridFeatures } from './table.js'
import type { DataGridOptions, DataGridProps, UseTable } from './props.js'

/** Headless data grid — table-core row model rendered through shared
 *  VirtualList. */
export declare function DataGrid<TData extends RowData = any>(props: DataGridProps<TData>): unknown

export declare function useTable<
	TData extends RowData,
	TFeatures extends TableFeatures = DataGridFeatures,
>(options: DataGridOptions<TFeatures, TData>): UseTable<TFeatures, TData>

export { createTable, dataGridFeatures } from './table.js'
export type { DataGridFeatures } from './table.js'
export type { DataGridOptions, DataGridProps, UseTable } from './props.js'
export type { Cell, ColumnDef, Header, Row, Table, TableState } from '@tanstack/table-core'
