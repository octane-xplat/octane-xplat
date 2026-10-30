import {
	aggregationFns,
	columnFacetingFeature,
	columnFilteringFeature,
	columnGroupingFeature,
	columnOrderingFeature,
	columnPinningFeature,
	columnSizingFeature,
	columnVisibilityFeature,
	constructTable,
	createExpandedRowModel,
	createFacetedMinMaxValues,
	createFacetedRowModel,
	createFacetedUniqueValues,
	createFilteredRowModel,
	createGroupedRowModel,
	createPaginatedRowModel,
	createSortedRowModel,
	filterFns,
	globalFilteringFeature,
	rowAggregationFeature,
	rowExpandingFeature,
	rowPaginationFeature,
	rowPinningFeature,
	rowSelectionFeature,
	rowSortingFeature,
	sortFns,
	tableFeatures,
} from '@tanstack/table-core'

import { storeReactivityBindings } from '@tanstack/table-core/store-reactivity-bindings'
import type { RowData, Table, TableFeatures } from '@tanstack/table-core'
import type { DataGridOptions } from './props'

/** DataGrid's default feature slots: every stock feature whose machinery is
 *  DOM-free — sorting, filtering, grouping, expanding, pagination, pinning,
 *  selection, column ordering/visibility/sizing, faceting, global filtering,
 *  aggregation — plus the row-model factories and builtin fn registries that
 *  v9 keeps as separate slots. Omitted: `columnResizingFeature` (its drag
 *  handler installs global event listeners — web-only; resize gesture UI
 *  belongs to platform leaves) and `cellSelectionFeature`/`cellSpanningFeature`
 *  (range-selection UX is web-spreadsheet-shaped, not a v1 xplat idiom). Pass
 *  `features` to add them where a platform leaf supports them. */
export const dataGridFeatures: {
	/** Faceted-values support for filter UIs. */
 import('@tanstack/table-core').TableFeature
	/** Per-column filter state. */
 import('@tanstack/table-core').TableFeature
	/** Group-by-column row model. */
 import('@tanstack/table-core').TableFeature
	/** Column reorder support. */
 import('@tanstack/table-core').TableFeature
	/** Pin columns left/right. */
 import('@tanstack/table-core').TableFeature
	/** Interactive column widths. */
 import('@tanstack/table-core').TableFeature
	/** Show/hide columns. */
 import('@tanstack/table-core').TableFeature
	/** Free-text filter across all columns. */
 import('@tanstack/table-core').TableFeature
	/** Aggregated cells in grouped rows. */
 import('@tanstack/table-core').TableFeature
	/** Expandable detail rows. */
 import('@tanstack/table-core').TableFeature
	/** Client-side pagination. */
 import('@tanstack/table-core').TableFeature
	/** Pin rows top/bottom. */
 import('@tanstack/table-core').TableFeature
	/** Row selection state. */
 import('@tanstack/table-core').TableFeature
	/** Click-to-sort headers. */
 import('@tanstack/table-core').TableFeature
	/** Materialize sorted rows. */
 (
		table: Table<any, any>,
	) => () => import('@tanstack/table-core').RowModel<any, any>
	/** Materialize filtered rows. */
 (
		table: Table<any, any>,
	) => () => import('@tanstack/table-core').RowModel<any, any>
	/** Materialize grouped rows. */
 (
		table: Table<any, any>,
	) => () => import('@tanstack/table-core').RowModel<any, any>
	/** Materialize expanded detail rows. */
 (
		table: Table<any, any>,
	) => () => import('@tanstack/table-core').RowModel<any, any>
	/** Materialize the current page. */
 (
		table: Table<any, any>,
	) => () => import('@tanstack/table-core').RowModel<any, any>
	/** Materialize faceted filter inputs. */
 (
		table: Table<any, any>,
		columnId: string,
	) => () => import('@tanstack/table-core').RowModel<any, any>
	/** Min/max faceting for numeric columns. */
 (
		table: Table<TableFeatures, any>,
		columnId: string,
	) => () => undefined | [number, number]
	/** Distinct-values faceting. */
 (
		table: Table<TableFeatures, any>,
		columnId: string,
	) => () => Map<any, number>
	/** Custom sort comparators by id. */
 {
		alphanumeric: import('@tanstack/table-core').CreatedSortFn<any, any>
		alphanumericCaseSensitive: import('@tanstack/table-core').CreatedSortFn<any, any>
		basic: import('@tanstack/table-core').CreatedSortFn<any, any>
		datetime: import('@tanstack/table-core').CreatedSortFn<any, any>
		text: import('@tanstack/table-core').CreatedSortFn<any, any>
		textCaseSensitive: import('@tanstack/table-core').CreatedSortFn<any, any>
	}
	/** Custom filter predicates by id. */
 {
		arrIncludes: import('@tanstack/table-core').CreatedFilterFn<any, any>
		arrIncludesAll: import('@tanstack/table-core').CreatedFilterFn<any, any>
		arrHas: import('@tanstack/table-core').CreatedFilterFn<any, any>
		arrIncludesSome: import('@tanstack/table-core').CreatedFilterFn<any, any>
		between: import('@tanstack/table-core').CreatedFilterFn<any, any>
		betweenInclusive: import('@tanstack/table-core').CreatedFilterFn<any, any>
		empty: import('@tanstack/table-core').CreatedFilterFn<any, any>
		endsWith: import('@tanstack/table-core').CreatedFilterFn<any, any>
		equals: import('@tanstack/table-core').CreatedFilterFn<any, any>
		equalsString: import('@tanstack/table-core').CreatedFilterFn<any, any>
		equalsStringSensitive: import('@tanstack/table-core').CreatedFilterFn<any, any>
		inDateRange: import('@tanstack/table-core').CreatedFilterFn<any, any>
		inNumberRange: import('@tanstack/table-core').CreatedFilterFn<any, any>
		includesString: import('@tanstack/table-core').CreatedFilterFn<any, any>
		includesStringSensitive: import('@tanstack/table-core').CreatedFilterFn<any, any>
		notEmpty: import('@tanstack/table-core').CreatedFilterFn<any, any>
		startsWith: import('@tanstack/table-core').CreatedFilterFn<any, any>
		weakEquals: import('@tanstack/table-core').CreatedFilterFn<any, any>
	}
	/** Custom aggregation functions by id. */
 {
		sum: import('@tanstack/table-core').AggregationFnDef<any, any, unknown, number>
		min: import('@tanstack/table-core').AggregationFnDef<
			any,
			any,
			unknown,
			(number | Date) | undefined
		>
		max: import('@tanstack/table-core').AggregationFnDef<
			any,
			any,
			unknown,
			(number | Date) | undefined
		>
		extent: import('@tanstack/table-core').AggregationFnDef<
			any,
			any,
			unknown,
			[(number | Date) | undefined, (number | Date) | undefined]
		>
		mean: import('@tanstack/table-core').AggregationFnDef<any, any, unknown, number | undefined>
		median: import('@tanstack/table-core').AggregationFnDef<any, any, unknown, number | undefined>
		unique: import('@tanstack/table-core').AggregationFnDef<any, any, unknown, unknown[]>
		uniqueCount: import('@tanstack/table-core').AggregationFnDef<any, any, unknown, number>
		count: import('@tanstack/table-core').AggregationFnDef<any, any, unknown, number>
		first: import('@tanstack/table-core').AggregationFnDef<any, any, unknown, unknown>
		last: import('@tanstack/table-core').AggregationFnDef<any, any, unknown, unknown>
	}
} = tableFeatures({
	columnFacetingFeature,
	columnFilteringFeature,
	columnGroupingFeature,
	columnOrderingFeature,
	columnPinningFeature,
	columnSizingFeature,
	columnVisibilityFeature,
	globalFilteringFeature,
	rowAggregationFeature,
	rowExpandingFeature,
	rowPaginationFeature,
	rowPinningFeature,
	rowSelectionFeature,
	rowSortingFeature,
	sortedRowModel: createSortedRowModel(),
	filteredRowModel: createFilteredRowModel(),
	groupedRowModel: createGroupedRowModel(),
	expandedRowModel: createExpandedRowModel(),
	paginatedRowModel: createPaginatedRowModel(),
	facetedRowModel: createFacetedRowModel(),
	facetedMinMaxValues: createFacetedMinMaxValues(),
	facetedUniqueValues: createFacetedUniqueValues(),
	sortFns,
	filterFns,
	aggregationFns,
})

/** Feature toggles/row-model selectors selecting the TanStack feature set. */
export type DataGridFeatures = typeof dataGridFeatures

/** Construct a table instance bound to TanStack Store reactivity — the
 *  vanilla/non-framework binding (`table.optionsStore` subscribable, atoms
 *  from `@tanstack/store`, `queueMicrotask` scheduling — all DOM-free). Wrap
 *  with `useTable` inside a component; call directly for non-rendering
 *  consumers (tests, headless row models). */
export function createTable<
	TData extends RowData,
	TFeatures extends TableFeatures = DataGridFeatures,
>(options: DataGridOptions<TFeatures, TData>): Table<TFeatures, TData> {
	return constructTable({
		...(options as object),
		features: {
			coreReactivityFeature: storeReactivityBindings(),
			...dataGridFeatures,
			...options.features,
		},
	} as never) as Table<TFeatures, TData>
}
