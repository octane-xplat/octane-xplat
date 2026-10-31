// Shared Table contracts — plugin pipeline types, render props, context, and
// the hook-facing state/config types exercised by the Astryx sandbox (Astryx
// 0.6.4 @ ebd939b, MIT). TableColumn/TableProps live in ../props.ts with the
// other shared prop contracts.

import type { ClassValue, Renderable } from '../props'
import type { TableColumn } from '../props'

// =============================================================================
// Context-menu actions (plugins contribute right-click actions per cell)
// =============================================================================

/** A single context-menu action contributed by a plugin. */
export interface TableContextAction {
	/** Stable identifier, unique within a single menu. */
	id: string
	/** Visible label for the menu item. */
	label: Renderable
	/** Optional leading icon node. */
	icon?: Renderable
	/** Invoked when the item is selected. */
	onSelect: () => void
	/** When true, the item is rendered but not selectable. */
	disabled?: boolean
	/** Group key used to cluster related actions; a divider separates groups. */
	group?: string
	/** When true, the item renders as checked. */
	checked?: boolean
	/** `'destructive'` renders the action in the error color. @default 'default' */
	variant?: 'default' | 'destructive'
}

/** Actions for a cell — a static array, or a getter resolved lazily when the
 *  menu opens. Prefer the getter for actions derived from state. */
export type TableContextActions = TableContextAction[] | (() => TableContextAction[])

// =============================================================================
// Render Props (plugin transform targets)
// =============================================================================

/**
 * Host-props bag produced by the pipeline. On web these spread onto the
 * rendered element (`style`, `aria-*`, `data-*`, `on*` handlers); native
 * leaves apply the documented safe subset (`style`/`className`) and drop the
 * rest.
 */
export type TableHostProps = Record<string, any>

/** Props passed through the plugin pipeline for the `<table>` element. */
export interface TableRenderProps {
	/** Attributes spread onto the `<table>` host — leaves apply the documented safe subset (`style`/`className`). */
	htmlProps: TableHostProps
	/** Extra host classes merged with the table's own. */
	classes: ClassValue[]
}

/** Props passed through the plugin pipeline for the header row. */
export interface HeaderRowRenderProps {
	/** Attributes spread onto the header-row host. */
	htmlProps: TableHostProps
	/** Extra classes merged onto the row. */
	classes: ClassValue[]
	/** Header cells rendered inside the row. */
	children: Renderable
}

/**
 * Props passed through the plugin pipeline for each header cell.
 * Named slots let plugins contribute content without conflicts — rendered in
 * order `before | content | after`, with `overlay` positioned absolutely on
 * top and `below` underneath the header label row.
 */
export interface HeaderCellRenderProps {
	/** Attributes spread onto the header-cell host. */
	htmlProps: TableHostProps
	/** Extra classes merged onto the cell. */
	classes: ClassValue[]
	/** Content rendered before the header label (e.g. selection checkbox). */
	before?: Renderable
	/** The header label content; initialized from `column.header ?? column.key`. */
	content?: Renderable
	/** Content rendered after the label (sort icon, filter trigger). */
	after?: Renderable
	/** Absolutely positioned overlay content (resize handle). */
	overlay?: Renderable
	/** Content below the header label row (inline filter controls). */
	below?: Renderable
	/** Context-menu actions contributed by plugins (concatenated across plugins). */
	contextMenuActions?: TableContextActions
	/** Index of this column in the final ordered column list (set by the pipeline). */
	columnIndex?: number
	/** The final ordered column list (set by the pipeline). */
	columns?: ReadonlyArray<TableColumn<any>>
}

/** Props passed through the plugin pipeline for each body row. */
export interface BodyRowRenderProps {
	/** Attributes spread onto the body-row host. */
	htmlProps: TableHostProps
	/** Extra classes merged onto the row. */
	classes: ClassValue[]
	/** When non-null after the pipeline, the leaf renders this IN PLACE of the
	 *  row's planned cells — plugins that replace a row wholesale set it
	 *  (grouped-rows swaps the cells for one full-width header cell). */
	children: Renderable
	/** Extra content rendered as a sibling immediately after this row (expansion
	 *  detail panels). Multiple plugins compose by wrapping the previous `afterRow`. */
	afterRow?: Renderable
}

/** Props passed through the plugin pipeline for each body cell. */
export interface BodyCellRenderProps {
	/** Attributes spread onto the body-cell host. */
	htmlProps: TableHostProps
	/** Extra classes merged onto the cell. */
	classes: ClassValue[]
	/** Context-menu actions contributed by plugins (concatenated per row). */
	contextMenuActions?: TableContextActions
	/** Index of this column in the final ordered list (set by the pipeline). */
	columnIndex?: number
	/** The final ordered column list (set by the pipeline). */
	columns?: ReadonlyArray<TableColumn<any>>
	/** When true, the pipeline calls neither `renderCell` nor the default
	 *  renderer — used by plugins that replace a row wholesale. */
	isContentSuppressed?: boolean
}

/**
 * Props passed through the plugin pipeline for the scroll-wrapper region —
 * the container around the table element. Plugins can attach a `ref` via
 * `htmlProps` and inject chrome via `beforeTable`/`afterTable`.
 */
export interface ScrollWrapperRenderProps {
	/** Attributes spread onto the scroll-container host. */
	htmlProps: TableHostProps
	/** Extra classes merged onto the container. */
	classes: ClassValue[]
	/** Content rendered before the table, inside the scroll container. */
	beforeTable?: Renderable
	/** Content rendered after the table, inside the scroll container. */
	afterTable?: Renderable
}

// =============================================================================
// Plugin Interface
// =============================================================================

/**
 * Table plugin — transforms render props at each structural level.
 * Plugins compose by sequential application (first plugin's output feeds the
 * next). Pipeline order:
 *
 *  1. `transformColumns` — filter, reorder, or inject columns
 *  2. `transformTable` — transform the root table-element props
 *  3. `transformHeaderCell` — transform each header cell's props
 *  4. `transformHeaderRow` — transform the header row props
 *  5. `transformBodyCell` — transform each body cell's props
 *  6. `transformBodyRow` — transform each body row's props
 *  7. `transformScrollWrapper` — transform the scroll container props
 *  8. `transformTableContext` — wrap the assembled output (providers, chrome)
 */
export interface TablePlugin<T extends Record<string, unknown> = Record<string, unknown>> {
	/** Filter, reorder, or inject columns — runs first in the pipeline. */
	transformColumns?: (columns: TableColumn<T>[]) => TableColumn<T>[]
	/** Transform the root table-element props. */
	transformTable?: (props: TableRenderProps) => TableRenderProps
	/** Transform each header row's props. */
	transformHeaderRow?: (props: HeaderRowRenderProps) => HeaderRowRenderProps
	/** Transform each header cell's props — receives the column and final ordering. */
	transformHeaderCell?: (
		props: HeaderCellRenderProps,
		column: TableColumn<T>,
		columnIndex: number,
		columns: ReadonlyArray<TableColumn<T>>,
	) => HeaderCellRenderProps
	/** Transform each body row's props — receives the row item and index. */
	transformBodyRow?: (props: BodyRowRenderProps, item: T, index: number) => BodyRowRenderProps
	/** Transform each body cell's props — receives column, item, and final ordering. */
	transformBodyCell?: (
		props: BodyCellRenderProps,
		column: TableColumn<T>,
		item: T,
		columnIndex: number,
		columns: ReadonlyArray<TableColumn<T>>,
	) => BodyCellRenderProps
	/** Transform the scroll-container props. */
	transformScrollWrapper?: (props: ScrollWrapperRenderProps) => ScrollWrapperRenderProps
	/** Wrap the assembled output — providers and chrome mount here. */
	transformTableContext?: (children: Renderable) => Renderable
}

// =============================================================================
// Table styling context (shared by parts in children mode)
// =============================================================================

/** Resolved table context — density, dividers, and the plugin pipeline
 *  outputs shared with cells and rows. */
export interface TableContextValue {
	/** Row height/padding density propagated to cells. */
	density: 'compact' | 'balanced' | 'spacious'
	/** Which grid lines are drawn. */
	dividers: 'rows' | 'columns' | 'grid' | 'none'
	/** Alternating row background. */
	isStriped: boolean
	/** Highlights the row under the pointer. */
	hasHover: boolean
	/** Vertical alignment of cell content. */
	verticalAlign: 'middle' | 'top' | 'bottom'
	/** Overflow behavior for cell text (wrap/ellipsis). */
	textOverflow: 'wrap' | 'truncate'
}

// =============================================================================
// Selection state (shared with TableSelectionToolbar and bulk-action UI)
// =============================================================================

/** Complete controlled selection shared between the selection plugin and
 *  selection-aware UI outside it (`useTableSelectionState` result). */
export interface TableSelectionState {
	/** Complete controlled selection, including keys outside the current view. */
	readonly selectedKeys: ReadonlySet<string>
	/** Number of keys in the complete controlled selection. */
	readonly selectedCount: number
	/** Whether the complete controlled selection contains any keys. */
	readonly hasSelection: boolean
	/** Clear every selected key, including keys outside the current view. */
	clearSelection: () => void
}

// =============================================================================
// Sort state
// =============================================================================

/** One sort direction on the shared scale. */
export type TableSortDirection = 'ascending' | 'descending'

/** One column's sort — key plus direction. */
export interface TableSortEntry<TSortKey extends string = string> {
	/** Column sort key — matches `TableSortableColumnConfig.sortKey` (defaults to column key). */
	sortKey: TSortKey
	/** Sort direction for this entry. */
	direction: TableSortDirection
}

/** Complete sort state — ordered entries; first is the primary sort. */
export type TableSortState<TSortKey extends string = string> = TableSortEntry<TSortKey>[]

/** Custom comparator for a single sort key (always ascending — the hook
 *  flips the sign for descending). */
export type TableSortComparator<T> = (a: T, b: T) => number

/** Sort configuration consumed by `useTableSortable` — produced by
 *  `useTableSortableState` or authored directly. */
export interface UseTableSortableConfig<TSortKey extends string = string> {
	/** Controlled sort state — ordered entries for multi-sort. */
	sort: TableSortState<TSortKey>
	/** Reports requested sort changes — the controlled pair for `sort`. */
	onSortChange: (sort: TableSortState<TSortKey>) => void
	/** Allows cycling back to no sort instead of pinning one direction. */
	allowUnsortedState?: boolean
	/** Allows multi-column sort (shift-click semantics). */
	isMultiSortEnabled?: boolean
}

// =============================================================================
// Filter state
// =============================================================================

/** Union of all filter value types (text=string, number=number, lists=string[]). */
export type TableFilterValue = string | number | string[]

/** Complete filter state — a map from column key to filter value. */
export type TableFilterState = Record<string, TableFilterValue | undefined>

/** Filter UI display variant: `'popover'` (funnel trigger per header),
 *  `'inline'` (control below the header), or `'inline-compact'`. */
export type TableFilterVariant = 'popover' | 'inline' | 'inline-compact'

// =============================================================================
// Sticky columns
// =============================================================================

/**
 * Config for `useTableStickyColumns`. Every field is optional so
 * `useTableStickyColumns({})` is an intentional no-op that pins nothing.
 */
export interface UseTableStickyColumnsConfig {
	/** Column keys pinned to the START (inline-start) edge — the contiguous run
	 *  from the first column through the last listed key. */
	startKeys?: string[]
	/** Column keys pinned to the END (inline-end) edge — the contiguous run from
	 *  the first listed key through the last column. */
	endKeys?: string[]
}

// =============================================================================
// Grouped rows
// =============================================================================

/** Configuration for `useTableGroupedRows`. */
export interface UseTableGroupedRowsConfig<T extends Record<string, unknown>> {
	/** The flat data to group. */
	data: T[]
	/** Derive the group key for a row. Rows with the same key share a section. */
	groupBy: (item: T) => string
	/** Set of currently-collapsed group keys. */
	collapsedGroups: Set<string>
	/** Called with a group key when its header is toggled. */
	onToggleGroup: (groupKey: string) => void
	/** Custom renderer for a group header's content (right of the chevron).
	 *  Defaults to `{key} ({count})`. */
	renderGroupHeader?: (groupKey: string, count: number, collapsed: boolean) => Renderable
	/** Stable key for a real row. Falls back to a positional key when omitted. */
	getRowKey?: (item: T) => string
	/** Explicit group ordering; groups not listed keep first-seen order after these. */
	groupOrder?: string[]
}

/** useTableGroupedRows result — the grouping plugin plus flattened row data. */
export interface UseTableGroupedRowsResult<T extends Record<string, unknown>> {
	/** Ready-to-use plugin for `<Table plugins>`. */
	plugin: TablePlugin<T>
	/** Flattened rows: `[header, ...visibleRows, header, ...visibleRows]`. */
	data: T[]
	/** Row-key resolver (also keys synthetic headers as `__group_<key>`).
	 *  Pass to `<Table idKey>`. */
	idKey: (item: T) => string
}

// =============================================================================
// Row expansion (detail panel)
// =============================================================================

/** Configuration for `useTableRowExpansion`. For hierarchical child rows that
 *  reuse the parent columns, use `useTableTreeData` + `useTableTreeState`. */
export interface UseTableRowExpansionConfig<T extends Record<string, unknown>> {
	/** Set of currently-expanded row keys. */
	expandedKeys: Set<string>
	/** Called with a row key when its expansion is toggled. */
	onToggle: (key: string) => void
	/** Derive a stable unique key from a row item. */
	getRowKey: (item: T) => string
	/** Render the detail content shown below the row while expanded. */
	renderExpanded: (item: T) => Renderable
	/** Control which rows are expandable. @default all rows expandable */
	getIsItemExpandable?: (item: T) => boolean
}

// =============================================================================
// Tree data
// =============================================================================

/** Structural position of one visible row within the tree. */
export interface TableTreeRowMeta {
	/** The row's id (from `idKey`). */
	id: string
	/** 0-based depth: roots are level 0. */
	level: number
	/** Whether the row shows an expander. */
	hasChildren: boolean
	/** Whether the row is currently expanded. */
	isExpanded: boolean
}

/**
 * Configuration for `useTableTreeData`. `useTableTreeState` returns a
 * ready-made value (`treeConfig`); consumers with server-driven or
 * pre-flattened trees can construct one directly.
 */
export interface UseTableTreeDataConfig<T extends Record<string, unknown>> {
	/** Structural meta for a visible row; undefined for unknown rows. */
	getRowMeta: (item: T) => TableTreeRowMeta | undefined
	/** Toggle a row's expansion. */
	onToggleItem: (item: T) => void
	/** Whether any row in the dataset is expandable. When false the plugin is a
	 *  no-op: no expanders, no indent, no tree ARIA — flat data renders
	 *  identically to a Table without the plugin. */
	hasExpandableRows: boolean
	/** Aggregate expansion state across every expandable row. With
	 *  `onExpandAll`/`onCollapseAll`, the tree column header shows an
	 *  expand-all toggle. */
	isAllExpanded?: boolean | 'indeterminate'
	/** Expand every expandable row. Wired to the header expand-all control. */
	onExpandAll?: () => void
	/** Collapse every row. Wired to the header expand-all control. */
	onCollapseAll?: () => void
	/** Show the expand-all/collapse-all toggle in the tree column header.
	 *  @default false */
	hasExpandAllControl?: boolean
	/** Indent step per level, as spacing tokens. @default 'md' */
	indent?: 'sm' | 'md' | 'lg'
	/** Column that carries the indent + expander. @default the first column */
	treeColumnKey?: string
	/** When true, clicking anywhere on an expandable row toggles its expansion,
	 *  in addition to the chevron. Clicks from interactive descendants or a
	 *  text selection do not toggle (web). @default false */
	hasRowClickExpansion?: boolean
}

// =============================================================================
// Row status
// =============================================================================

/** Named colors supported by the custom row-status marker; raw CSS colors are
 *  passed through untouched. */
export type TableRowStatusColor =
	| 'accent'
	| 'success'
	| 'error'
	| 'warning'
	| 'red'
	| 'orange'
	| 'green'
	| 'yellow'
	| 'blue'
	| 'gray'

/** Semantic row status — resolves to the themed status glyph and tone. */
export interface TableSemanticRowStatus {
	/** Semantic level — resolves to the themed glyph and tone. */
	status: 'success' | 'warning' | 'error'
	/** Spoken/visible status text. */
	label: string
}

/** Custom row-status marker — a named/raw `color`, optional `icon` name. */
export interface TableRowStatus {
	/** Marker color — a named token or raw value. */
	color: string
	/** Optional marker icon name. */
	icon?: string
	/** Spoken/visible status text. */
	label: string
}
