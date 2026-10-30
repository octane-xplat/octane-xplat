import type { TableColumn } from '../props'
import type { TablePlugin } from './types'
import type { UseTableColumnResizeConfig } from './use-table-column-resize.tsrx'

/** Native flex rows need widths in the column plan, not just header CSS. */
export function createAppKitColumnResizePlugin<T extends Record<string, unknown>>(
	config: () => UseTableColumnResizeConfig,
): TablePlugin<T> {
	return {
		transformColumns(columns) {
			const widths = config().columnWidths
			if (!widths) {return columns}
			let changed = false
			const next = columns.map((column) => {
				if (!Object.prototype.hasOwnProperty.call(widths, column.key)) {return column}
				const value = widths[column.key]
				if (value == null) {return column}
				if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
					throw new TypeError('AppKit table column widths must be finite nonnegative numbers')
				}
				if (column.width?.type === 'pixel' && column.width.value === value) {return column}
				changed = true
				return { ...column, width: { type: 'pixel' as const, value } }
			})
			return changed ? next : columns
		},
	}
}
