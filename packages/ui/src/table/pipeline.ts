// Plugin pipeline — sequential transform application plus canonical plugin
// ordering. Port of upstream BaseTable's applyPlugins and
// useBaseTablePlugins ordering rules (Astryx 0.6.4, MIT).

import type { TableColumn } from '../props'
import type {
	TablePlugin,
	TableRenderProps,
	HeaderRowRenderProps,
	HeaderCellRenderProps,
	BodyRowRenderProps,
	BodyCellRenderProps,
	ScrollWrapperRenderProps,
} from './types'

/** Run a value through a pipeline of plugin transform functions. A plugin
 *  that throws is skipped — one broken plugin must not blank the table. */
export function applyPlugins<T extends Record<string, unknown>, TProps, TArgs extends unknown[]>(
	plugins: TablePlugin<T>[],
	getter: (p: TablePlugin<T>) => ((props: TProps, ...args: TArgs) => TProps) | undefined,
	initial: TProps,
	...args: TArgs
): TProps {
	return plugins.reduce<TProps>((acc, plugin, index) => {
		const transform = getter(plugin)
		if (!transform) {
			return acc
		}
		try {
			return transform.call(plugin, acc, ...args)
		} catch (error) {
			if (typeof console !== 'undefined') {
				console.error(`Table plugin at index ${index} threw in transform:`, error)
			}

			return acc
		}
	}, initial)
}

/**
 * Canonical ordering for first-party plugin names — decides layout, not
 * whether the table works:
 *   columnSettings → sort → tree → selection → pagination
 * Unknown names keep their record order after the known set.
 */
const PLUGIN_ORDER: ReadonlyArray<string> = [
	'columnSettings',
	'sort',
	'tree',
	'selection',
	'pagination',
]

const PLUGIN_ORDER_MAP = new Map(PLUGIN_ORDER.map((name, index) => [name, index]))

/** Convert a named plugin record to an ordered plugin array. */
export function resolveTablePlugins<T extends Record<string, unknown>>(
	basePlugins: TablePlugin<T>[],
	userPlugins: Record<string, TablePlugin<T>> | undefined,
): TablePlugin<T>[] {
	const sorted = userPlugins
		? Object.entries(userPlugins)
				.sort(
					([a], [b]) =>
						(PLUGIN_ORDER_MAP.get(a) ?? PLUGIN_ORDER.length) -
						(PLUGIN_ORDER_MAP.get(b) ?? PLUGIN_ORDER.length),
				)
				.map(([, plugin]) => plugin)
		: []
	return [...basePlugins, ...sorted]
}

// =============================================================================
// Render plan — everything the platform leaves need, computed once.
// =============================================================================

export interface PlannedHeaderCell<T extends Record<string, unknown>> {
	column: TableColumn<T>
	render: HeaderCellRenderProps
	widthStyle: Record<string, string | number>
}

export interface PlannedBodyCell<T extends Record<string, unknown>> {
	column: TableColumn<T>
	render: BodyCellRenderProps
	/** Resolved cell content (default renderer or `renderCell`); absent when suppressed. */
	content: unknown
	/** True when the default string renderer produced the content. */
	isDefaultRenderer: boolean
}

export interface PlannedRow<T extends Record<string, unknown>> {
	item: T
	index: number
	key: string | number
	render: BodyRowRenderProps
	cells: PlannedBodyCell<T>[]
	ariaRowIndex?: number
}

export interface TableRenderPlan<T extends Record<string, unknown>> {
	columns: TableColumn<T>[]
	tableMinWidth: number
	table: TableRenderProps
	headerRow: HeaderRowRenderProps
	headerCells: PlannedHeaderCell<T>[]
	rows: PlannedRow<T>[]
	/** Column count to span for the empty-state row. */
	colSpan: number
	showEmptyState: boolean
	scrollWrapper: ScrollWrapperRenderProps
	plugins: TablePlugin<T>[]
}

import { generateColumns, resolveColumnWidths, defaultCellRenderer } from './column-utils'

export interface PlanSource<T extends Record<string, unknown>> {
	data?: T[]
	columns?: TableColumn<T>[]
	idKey?: ((item: T) => string | number) | keyof T
	plugins: TablePlugin<T>[]
	textOverflow: 'wrap' | 'truncate'
	rowIndexStart?: number
	rowCount?: number
	emptyState?: unknown
}

/**
 * Run the plugin pipeline and produce a platform-neutral render plan.
 * Platform leaves map the plan to elements: `table`/`headerRow`/`headerCells`/
 * `rows`/`scrollWrapper` host props plus each plugin's
 * `transformTableContext` wrapped around the assembled output.
 */
export function planTableRender<T extends Record<string, unknown>>(
	source: PlanSource<T>,
): TableRenderPlan<T> {
	const { data, columns: columnsProp, idKey, plugins, rowIndexStart, rowCount, emptyState } = source

	const ariaRowIndexingEnabled = rowIndexStart != null || rowCount != null
	const firstRowAriaIndex = rowIndexStart ?? 1

	const baseColumns: TableColumn<T>[] = columnsProp ?? (data ? generateColumns(data) : [])
	const resolvedColumns = applyPlugins(plugins, (p) => p.transformColumns, baseColumns)
	const widths = resolveColumnWidths(resolvedColumns)

	const table = applyPlugins(plugins, (p) => p.transformTable, {
		htmlProps: ariaRowIndexingEnabled ? { 'aria-rowcount': rowCount ?? -1 } : {},
		classes: [] as never,
	} as TableRenderProps)

	const headerCells = resolvedColumns.map((col, columnIndex): PlannedHeaderCell<T> => {
		const htmlProps: Record<string, unknown> = {
			'data-column-key': col.key,
			scope: 'col',
		}
		if (col.align) {
			htmlProps.style = { textAlign: col.align }
		}
		const render = applyPlugins(
			plugins,
			(p) => p.transformHeaderCell,
			{
				htmlProps,
				classes: [] as never,
				content: col.header ?? col.key,
				columnIndex,
				columns: resolvedColumns,
			} as HeaderCellRenderProps,
			col,
			columnIndex,
			resolvedColumns,
		)
		return { column: col, render, widthStyle: widths.columns.get(col.key)?.style ?? {} }
	})

	const headerRow = applyPlugins(plugins, (p) => p.transformHeaderRow, {
		htmlProps: {},
		classes: [] as never,
		children: undefined,
	} as HeaderRowRenderProps)

	const rows: PlannedRow<T>[] = (data ?? []).map((item, rowIndex) => {
		const cells = resolvedColumns.map((col, columnIndex): PlannedBodyCell<T> => {
			const htmlProps: Record<string, unknown> = {}
			if (col.align) {
				htmlProps.style = { textAlign: col.align }
			}
			const render = applyPlugins(
				plugins,
				(p) => p.transformBodyCell,
				{
					htmlProps,
					classes: [] as never,
					columnIndex,
					columns: resolvedColumns,
				} as BodyCellRenderProps,
				col,
				item,
				columnIndex,
				resolvedColumns,
			)
			const isDefaultRenderer = !col.renderCell
			const content = render.isContentSuppressed
				? undefined
				: isDefaultRenderer
					? defaultCellRenderer(item, col.key)
					: col.renderCell!(item)
			return { column: col, render, content, isDefaultRenderer }
		})

		const rowKey =
			idKey == null
				? rowIndex
				: typeof idKey === 'function'
					? idKey(item)
					: String(item[idKey as keyof T])

		const render = applyPlugins(
			plugins,
			(p) => p.transformBodyRow,
			{
				htmlProps: ariaRowIndexingEnabled ? { 'aria-rowindex': firstRowAriaIndex + rowIndex } : {},
				classes: [] as never,
				children: undefined,
			} as BodyRowRenderProps,
			item,
			rowIndex,
		)
		return {
			item,
			index: rowIndex,
			key: rowKey,
			render,
			cells,
			ariaRowIndex: ariaRowIndexingEnabled ? firstRowAriaIndex + rowIndex : undefined,
		}
	})

	const scrollWrapper = applyPlugins(plugins, (p) => p.transformScrollWrapper, {
		htmlProps: {},
		classes: [] as never,
	} as ScrollWrapperRenderProps)

	return {
		columns: resolvedColumns,
		tableMinWidth: widths.tableMinWidth,
		table,
		headerRow,
		headerCells,
		rows,
		colSpan: resolvedColumns.length,
		showEmptyState: data != null && data.length === 0 && emptyState !== false,
		scrollWrapper,
		plugins,
	}
}

/** Apply the transformTableContext chain around an assembled node —
 *  outermost plugin wraps last, matching upstream's sequential application. */
export function wrapTableContext<T extends Record<string, unknown>>(
	plugins: TablePlugin<T>[],
	node: unknown,
): unknown {
	let out = node
	for (const plugin of plugins) {
		if (plugin.transformTableContext) {
			try {
				out = plugin.transformTableContext(out)
			} catch (error) {
				if (typeof console !== 'undefined') {
					console.error('Table plugin transformTableContext threw:', error)
				}
			}
		}
	}
	return out
}
