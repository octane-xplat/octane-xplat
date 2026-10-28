// Row-index plugin — port of upstream plugins/rowIndex/useTableRowIndex.tsx
// (Astryx 0.6.4, MIT). Shared leaf: prepends a right-aligned, monospaced
// row-number column; numbering follows the rendered `data` array order.

import { useMemo } from 'octane'
import type { TablePlugin } from './types'
import type { Renderable, TableColumn } from '../props'
import { pixel } from './column-utils'
import { Text } from '../Text'
import { tableSlot } from './table-slot'

/**
 * Configuration for `useTableRowIndex`.
 *
 * `renderCell` receives only the row item (not its position), so the plugin
 * needs the rendered `data` array — the same array passed to `<Table data>` —
 * to derive each row's ordinal. Pass `getRowKey` when items don't have a
 * stable identity by reference; it must return a **unique** string per row.
 */
export interface UseTableRowIndexConfig<T extends Record<string, unknown>> {
	/** The data array currently rendered by the table (post sort/filter/page). */
	data: T[]
	/** Optional key extractor returning a **unique** string per row. When
	 *  provided, index lookup is keyed by the returned string; otherwise items
	 *  match by reference identity. */
	getRowKey?: (item: T) => string
	/** Header label for the index column. @default '#' */
	label?: Renderable
	/** First index value. @default 1 */
	startFrom?: number
}

const INDEX_COLUMN_WIDTH = pixel(48)

function RowIndexCell<T extends Record<string, unknown>>(props: {
	item: T
	lookup: (item: T) => number | undefined
	startFrom: number
}) @{
	const idx = props.lookup(props.item)
	if (idx == null) {
		return null as any
	}

	<Text className="vx-table-rowindex">{idx + props.startFrom}</Text>
}

/**
 * Returns a `TablePlugin` that prepends a right-aligned, monospaced
 * row-number column. Numbering follows the order of the rendered `data`
 * array, so it reflects the current sort / filter / pagination view.
 */
export function useTableRowIndex<T extends Record<string, unknown>>(
	config: UseTableRowIndexConfig<T>,
): TablePlugin<T> {
	const { data, getRowKey, label = '#', startFrom = 1 } = config

	// Single item → ordinal lookup, rebuilt when the data array or key
	// extractor changes. Keyed by getRowKey when provided, else by reference.
	const lookup = useMemo(() => {
		const map = new Map<unknown, number>()
		for (let i = 0; i < data.length; i++) {
			const item = data[i]!
			map.set(getRowKey ? getRowKey(item) : item, i)
		}

		return (item: T): number | undefined => map.get(getRowKey ? getRowKey(item) : item)
	}, [data, getRowKey])

	return {
		transformColumns(columns) {
			const indexColumn: TableColumn<T> = {
				key: '__rowIndex',
				header: label,
				width: INDEX_COLUMN_WIDTH,
				align: 'end',
				resizable: false,
				renderCell: (item: T) => tableSlot(RowIndexCell, { item, lookup, startFrom }),
			}

			return [indexColumn, ...columns]
		},
	}
}
