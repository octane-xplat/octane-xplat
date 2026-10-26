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
	htmlProps: TableHostProps
	/** Extra host classes merged with the table's own. */
	classes: ClassValue[]
}

/** Props passed through the plugin pipeline for the header row. */
export interface HeaderRowRenderProps {
	htmlProps: TableHostProps
	classes: ClassValue[]
	children: Renderable
}

/**
 * Props passed through the plugin pipeline for each header cell.
 * Named slots let plugins contribute content without conflicts — rendered in
 * order `before | content | after`, with `overlay` positioned absolutely on
 * top and `below` underneath the header label row.
 */
export interface HeaderCellRenderProps {
	htmlProps: TableHostProps
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
	htmlProps: TableHostProps
	classes: ClassValue[]
	children: Renderable
	/** Extra content rendered as a sibling immediately after this row (expansion
	 *  detail panels). Multiple plugins compose by wrapping the previous `afterRow`. */
	afterRow?: Renderable
}

/** Props passed through the plugin pipeline for each body cell. */
export interface BodyCellRenderProps {
	htmlProps: TableHostProps
	classes: ClassValue[]
	/** Context-menu actions contributed by plugins (concatenated per row). */
	contextMenuActions?: TableContextActions
	columnIndex?: number
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
	htmlProps: TableHostProps
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
	transformColumns?: (columns: TableColumn<T>[]) => TableColumn<T>[]
	transformTable?: (props: TableRenderProps) => TableRenderProps
	transformHeaderRow?: (props: HeaderRowRenderProps) => HeaderRowRenderProps
	transformHeaderCell?: (
		props: HeaderCellRenderProps,
		column: TableColumn<T>,
		columnIndex: number,
		columns: ReadonlyArray<TableColumn<T>>,
	) => HeaderCellRenderProps
	transformBodyRow?: (props: BodyRowRenderProps, item: T, index: number) => BodyRowRenderProps
	transformBodyCell?: (
		props: BodyCellRenderProps,
		column: TableColumn<T>,
		item: T,
		columnIndex: number,
		columns: ReadonlyArray<TableColumn<T>>,
	) => BodyCellRenderProps
	transformScrollWrapper?: (props: ScrollWrapperRenderProps) => ScrollWrapperRenderProps
	transformTableContext?: (children: Renderable) => Renderable
}

// =============================================================================
// Table styling context (shared by parts in children mode)
// =============================================================================

export interface TableContextValue {
	density: 'compact' | 'balanced' | 'spacious'
	dividers: 'rows' | 'columns' | 'grid' | 'none'
	isStriped: boolean
	hasHover: boolean
	verticalAlign: 'middle' | 'top' | 'bottom'
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

export type TableSortDirection = 'ascending' | 'descending'

export interface TableSortEntry<TSortKey extends string = string> {
	sortKey: TSortKey
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
	sort: TableSortState<TSortKey>
	onSortChange: (sort: TableSortState<TSortKey>) => void
	allowUnsortedState?: boolean
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
