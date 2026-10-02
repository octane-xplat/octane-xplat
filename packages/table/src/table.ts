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
export const dataGridFeatures = tableFeatures({
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
