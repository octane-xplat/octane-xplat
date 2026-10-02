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
	/** Core options (atoms, change callbacks, manual row models, selection
	 * predicates). Data/columns and the explicit props below take precedence. */
	options?: Omit<
		DataGridOptions<TFeatures, TData>,
		'data' | 'columns' | 'features' | 'state' | 'initialState' | 'getRowId'
	>
	/** Partial controlled state. Pair with options.atoms or per-slice
	 * options callbacks; a state snapshot alone is read-only. */
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
	/** Show a text query across globally filterable columns. */
	showGlobalFilter?: boolean
	/** Show text filters beneath filterable leaf-column headings. */
	showColumnFilters?: boolean
	/** Show previous/next and page-size controls. Client-side by default;
	 * use options.manualPagination with pageCount/rowCount for server data. */
	showPagination?: boolean
	/** Positive integer page sizes offered by the pager. Defaults to [10, 25, 50]. */
	pageSizeOptions?: readonly number[]
	/** Show row checkboxes and a current-page select-all checkbox. Selection
	 * survives filtering/pagination by ID; provide getRowId for mutable data. */
	showRowSelection?: boolean
	/** Optional label for each selection checkbox. */
	getRowLabel?: (row: Row<TFeatures, TData>) => string
	/** Show a column visibility/order panel, reset to initial state, and
	 * keyboard/touch move buttons. Non-hideable columns stay visible. */
	showColumnSettings?: boolean
	/** Fixed-width columns with pan resize handles and accessible +/- actions.
	 * Widths use column minSize/maxSize; cancellation restores prior state. */
	resizableColumns?: boolean
	/** Separate pan handles reorder leaf columns on release. Cancel preserves
	 * order; settings move buttons provide a non-drag alternative. */
	reorderableColumns?: boolean
	/** Horizontal gesture direction. Defaults to ltr; use rtl for mirrored layouts. */
	direction?: 'ltr' | 'rtl'
	/** Caller-owned bulk actions; selected IDs include off-page selections. */
	renderSelectionActions?: (table: Table<TFeatures, TData>) => any
	/** Platform escape bags — applied after shared props on the root view. */
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}
