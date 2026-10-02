import type {
	Cell,
	ColumnDef,
	Header,
	Row,
	RowData,
	Table,
	TableFeatures,
	TableOptions,
	TableState,
} from '@tanstack/table-core'

import type { DataGridFeatures } from './table'

export interface LayoutChildProps {
	row?: number
	col?: number
	rowSpan?: number
	colSpan?: number
	dock?: 'left' | 'top' | 'right' | 'bottom'
	left?: number
	top?: number
	flexGrow?: number
	flexShrink?: number
	alignSelf?: string
	order?: number
}

export interface AccessibilityProps {
	accessible?: boolean
	accessibilityLabel?: string
	accessibilityHint?: string
	accessibilityRole?: string
	accessibilityState?: Record<string, any>
	testID?: string
}

/** Options shared by `createTable`/`useTable`/`DataGrid`. Extends the
 *  table-core options for the enabled feature set minus its reactivity slot
 *  (owned by the adapter). */
export type DataGridOptions<TFeatures extends TableFeatures, TData extends RowData> = Omit<
	TableOptions<TFeatures, TData>,
	'features' | 'coreReactivityFeature'
> & {
	/** Feature slots beyond the defaults — pass `tableFeatures({...})`
	 *  output or merge onto `dataGridFeatures`. */
	features?: Partial<TableFeatures>
}

/** `useTable` return — the live table instance plus the flat reactive state.
 *  `state` re-reads on every slice change; row models come from
 *  `table.getRowModel()` (memoized per state/option revision). */
export interface UseTable<TFeatures extends TableFeatures, TData extends RowData> {
	table: Table<TFeatures, TData>
	state: TableState<TFeatures>
}

export interface DataGridProps<
	TData extends RowData = any,
	TFeatures extends TableFeatures = DataGridFeatures,
>
	extends LayoutChildProps, AccessibilityProps {
	id?: string
	className?: any
	style?: any
	/** Row data — pass a new array reference when data changes. */
	data: TData[]
	columns: ColumnDef<TFeatures, TData, any>[]
	/** Feature overrides merged onto the defaults (see `dataGridFeatures`). */
	features?: Partial<TableFeatures>
	/** Partial controlled state — pair with `atoms` or subscribe to
	 *  `table.atoms.<slice>` / `table.store` for change notifications. */
	state?: Partial<TableState<TFeatures>>
	initialState?: Partial<TableState<TFeatures>>
	getRowId?: (row: TData, index: number) => string
	/** Per-cell content override. Defaults to the column's `cell` template,
	 *  then `cell.getValue()`. */
	renderCell?: (cell: Cell<TFeatures, TData, any>) => any
	/** Per-header content override. Defaults to the column's `header`
	 *  template plus a sort affordance when the column can sort. */
	renderHeader?: (header: Header<TFeatures, TData, any>) => any
	/** Row tap — marks rows pressable. */
	onRowPress?: (row: Row<TFeatures, TData>) => void
	renderEmpty?: () => any
	/** Platform escape bags — applied after shared props on the root view. */
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}
