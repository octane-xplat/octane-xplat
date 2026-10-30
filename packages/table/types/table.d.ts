import type { RowData, Table, TableFeatures } from '@tanstack/table-core';
import type { DataGridOptions } from './props';
/** DataGrid's default feature slots: every stock feature whose machinery is
 *  DOM-free — sorting, filtering, grouping, expanding, pagination, pinning,
 *  selection, column ordering/visibility/sizing, faceting, global filtering,
 *  aggregation — plus the row-model factories and builtin fn registries that
 *  v9 keeps as separate slots. Omitted: `columnResizingFeature` (its drag
 *  handler installs global event listeners — web-only; resize gesture UI
 *  belongs to platform leaves) and `cellSelectionFeature`/`cellSpanningFeature`
 *  (range-selection UX is web-spreadsheet-shaped, not a v1 xplat idiom). Pass
 *  `features` to add them where a platform leaf supports them. */
export declare const dataGridFeatures: {
    columnFacetingFeature: import("@tanstack/table-core").TableFeature;
    columnFilteringFeature: import("@tanstack/table-core").TableFeature;
    columnGroupingFeature: import("@tanstack/table-core").TableFeature;
    columnOrderingFeature: import("@tanstack/table-core").TableFeature;
    columnPinningFeature: import("@tanstack/table-core").TableFeature;
    columnSizingFeature: import("@tanstack/table-core").TableFeature;
    columnVisibilityFeature: import("@tanstack/table-core").TableFeature;
    globalFilteringFeature: import("@tanstack/table-core").TableFeature;
    rowAggregationFeature: import("@tanstack/table-core").TableFeature;
    rowExpandingFeature: import("@tanstack/table-core").TableFeature;
    rowPaginationFeature: import("@tanstack/table-core").TableFeature;
    rowPinningFeature: import("@tanstack/table-core").TableFeature;
    rowSelectionFeature: import("@tanstack/table-core").TableFeature;
    rowSortingFeature: import("@tanstack/table-core").TableFeature;
    sortedRowModel: (table: Table<any, any>) => () => import("@tanstack/table-core").RowModel<any, any>;
    filteredRowModel: (table: Table<any, any>) => () => import("@tanstack/table-core").RowModel<any, any>;
    groupedRowModel: (table: Table<any, any>) => () => import("@tanstack/table-core").RowModel<any, any>;
    expandedRowModel: (table: Table<any, any>) => () => import("@tanstack/table-core").RowModel<any, any>;
    paginatedRowModel: (table: Table<any, any>) => () => import("@tanstack/table-core").RowModel<any, any>;
    facetedRowModel: (table: Table<any, any>, columnId: string) => () => import("@tanstack/table-core").RowModel<any, any>;
    facetedMinMaxValues: (table: Table<TableFeatures, any>, columnId: string) => () => undefined | [number, number];
    facetedUniqueValues: (table: Table<TableFeatures, any>, columnId: string) => () => Map<any, number>;
    sortFns: {
        alphanumeric: import("@tanstack/table-core").CreatedSortFn<any, any>;
        alphanumericCaseSensitive: import("@tanstack/table-core").CreatedSortFn<any, any>;
        basic: import("@tanstack/table-core").CreatedSortFn<any, any>;
        datetime: import("@tanstack/table-core").CreatedSortFn<any, any>;
        text: import("@tanstack/table-core").CreatedSortFn<any, any>;
        textCaseSensitive: import("@tanstack/table-core").CreatedSortFn<any, any>;
    };
    filterFns: {
        arrIncludes: import("@tanstack/table-core").CreatedFilterFn<any, any>;
        arrIncludesAll: import("@tanstack/table-core").CreatedFilterFn<any, any>;
        arrHas: import("@tanstack/table-core").CreatedFilterFn<any, any>;
        arrIncludesSome: import("@tanstack/table-core").CreatedFilterFn<any, any>;
        between: import("@tanstack/table-core").CreatedFilterFn<any, any>;
        betweenInclusive: import("@tanstack/table-core").CreatedFilterFn<any, any>;
        empty: import("@tanstack/table-core").CreatedFilterFn<any, any>;
        endsWith: import("@tanstack/table-core").CreatedFilterFn<any, any>;
        equals: import("@tanstack/table-core").CreatedFilterFn<any, any>;
        equalsString: import("@tanstack/table-core").CreatedFilterFn<any, any>;
        equalsStringSensitive: import("@tanstack/table-core").CreatedFilterFn<any, any>;
        inDateRange: import("@tanstack/table-core").CreatedFilterFn<any, any>;
        inNumberRange: import("@tanstack/table-core").CreatedFilterFn<any, any>;
        includesString: import("@tanstack/table-core").CreatedFilterFn<any, any>;
        includesStringSensitive: import("@tanstack/table-core").CreatedFilterFn<any, any>;
        notEmpty: import("@tanstack/table-core").CreatedFilterFn<any, any>;
        startsWith: import("@tanstack/table-core").CreatedFilterFn<any, any>;
        weakEquals: import("@tanstack/table-core").CreatedFilterFn<any, any>;
    };
    aggregationFns: {
        sum: import("@tanstack/table-core").AggregationFnDef<any, any, unknown, number>;
        min: import("@tanstack/table-core").AggregationFnDef<any, any, unknown, (number | Date) | undefined>;
        max: import("@tanstack/table-core").AggregationFnDef<any, any, unknown, (number | Date) | undefined>;
        extent: import("@tanstack/table-core").AggregationFnDef<any, any, unknown, [(number | Date) | undefined, (number | Date) | undefined]>;
        mean: import("@tanstack/table-core").AggregationFnDef<any, any, unknown, number | undefined>;
        median: import("@tanstack/table-core").AggregationFnDef<any, any, unknown, number | undefined>;
        unique: import("@tanstack/table-core").AggregationFnDef<any, any, unknown, unknown[]>;
        uniqueCount: import("@tanstack/table-core").AggregationFnDef<any, any, unknown, number>;
        count: import("@tanstack/table-core").AggregationFnDef<any, any, unknown, number>;
        first: import("@tanstack/table-core").AggregationFnDef<any, any, unknown, unknown>;
        last: import("@tanstack/table-core").AggregationFnDef<any, any, unknown, unknown>;
    };
};
export type DataGridFeatures = typeof dataGridFeatures;
/** Construct a table instance bound to TanStack Store reactivity — the
 *  vanilla/non-framework binding (`table.optionsStore` subscribable, atoms
 *  from `@tanstack/store`, `queueMicrotask` scheduling — all DOM-free). Wrap
 *  with `useTable` inside a component; call directly for non-rendering
 *  consumers (tests, headless row models). */
export declare function createTable<TData extends RowData, TFeatures extends TableFeatures = DataGridFeatures>(options: DataGridOptions<TFeatures, TData>): Table<TFeatures, TData>;
