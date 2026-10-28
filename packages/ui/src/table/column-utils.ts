// Column width DSL and resolution — port of upstream
// packages/core/src/Table/columnUtils.ts (Astryx 0.6.4, MIT). Styles are
// emitted as plain CSS style objects; native leaves map the same numbers to
// dips/flex weights.

import type { TableColumn, ProportionalWidth, PixelWidth } from '../props'

/** Default minimum width (in px) for proportional columns. */
export const DEFAULT_MIN_COLUMN_WIDTH = 120

/** Pre-computed width information for a single column. */
export interface ResolvedColumnWidth {
	/** Style to apply on the header cell for this column (`width`, `minWidth` in px or %). */
	style: Record<string, string | number>
}

/** Result of `resolveColumnWidths()` — per-column width styles plus the
 *  aggregate table min-width. */
export interface ResolvedColumnWidths {
	columns: Map<string, ResolvedColumnWidth>
	tableMinWidth: number
}

/**
 * Resolve column widths for the entire table in a single pass. Proportional
 * columns get a percentage `width` plus a `minWidth` floor; pixel columns get
 * both set to their value. `tableMinWidth` is the sum of pixel widths plus
 * the proportional space required to satisfy the largest minWidth.
 */
export function resolveColumnWidths<T extends Record<string, unknown>>(
	columns: TableColumn<T>[],
): ResolvedColumnWidths {
	let totalProportion = 0
	let pixelTotal = 0
	const proportionalCols: { key: string; proportion: number; minWidth: number }[] = []

	for (const col of columns) {
		const w = col.width
		if (w?.type === 'pixel') {
			pixelTotal += w.value
		} else {
			const proportion = w?.value ?? 1
			// Only columns that explicitly used proportional() carry a minimum.
			const minW = w != null ? (w.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH) : 0
			totalProportion += proportion
			proportionalCols.push({ key: col.key, proportion, minWidth: minW })
		}
	}

	let maxProportionalSpace = 0
	if (totalProportion > 0) {
		for (const col of proportionalCols) {
			const required = (col.minWidth * totalProportion) / col.proportion
			if (required > maxProportionalSpace) {
				maxProportionalSpace = required
			}
		}
	}
	const tableMinWidth = pixelTotal + maxProportionalSpace

	const result = new Map<string, ResolvedColumnWidth>()
	for (const col of columns) {
		const w = col.width
		const style: Record<string, string> = {}
		if (w?.type === 'pixel') {
			style.width = `${w.value}px`
			style.minWidth = `${w.value}px`
		} else {
			const proportion = w?.value ?? 1
			if (totalProportion > 0) {
				style.width = `${(proportion / totalProportion) * 100}%`
			}

			if (w != null) {
				const minW = w.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH
				style.minWidth = `${minW}px`
			}
		}

		result.set(col.key, { style })
	}

	return { columns: result, tableMinWidth }
}

/**
 * Create a proportional column width (fr-like). Columns share available
 * space proportionally; `minWidth` defaults to `DEFAULT_MIN_COLUMN_WIDTH`.
 *
 * @example
 * proportional(2) // twice as wide as proportional(1)
 * proportional(1, { minWidth: 200 })
 */
export function proportional(
	value: number = 1,
	options?: { minWidth?: number },
): ProportionalWidth {
	return { type: 'proportional', value, minWidth: options?.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH }
}

/** Create a fixed pixel column width. */
export function pixel(value: number): PixelWidth {
	return { type: 'pixel', value }
}

/** Capitalize the first letter of a string. */
export function capitalize(str: string): string {
	if (str.length === 0) {
		return str
	}
	const first = str[0]!
	return first.toUpperCase() + str.slice(first.length)
}

/** Default cell renderer — converts the value at `item[key]` to a string. */
export function defaultCellRenderer<T extends Record<string, unknown>>(
	item: T,
	key: string,
): string {
	const value = item[key]
	if (value == null) {
		return ''
	}
	if (value instanceof Date) {
		return value.toISOString()
	}
	if (
		typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean' ||
		typeof value === 'bigint'
	) {
		return String(value)
	}
	return ''
}

function estimateContentLength(value: unknown): number {
	if (value == null) {
		return 0
	}
	if (typeof value === 'string') {
		return value.length
	}
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value).length
	}
	return 0
}

function longestWord(value: unknown): number {
	if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
		return 0
	}
	const str = String(value)
	let max = 0
	let current = 0
	for (let i = 0; i <= str.length; i++) {
		if (i === str.length || str[i] === ' ' || str[i] === '\t' || str[i] === '\n') {
			if (current > max) {
				max = current
			}

			current = 0
		} else {
			current++
		}
	}
	return max
}

const MIN_COLUMN_FLOOR = 60
const PX_PER_CHAR = 8

/**
 * Auto-generate column definitions from the keys of the first data item —
 * content-proportional widths derived from the header and the first few rows.
 */
export function generateColumns<T extends Record<string, unknown>>(data: T[]): TableColumn<T>[] {
	if (data.length === 0) {
		return []
	}
	const keys = Object.keys(data[0]!)
	const sampleRows = data.slice(0, Math.min(5, data.length))

	return keys.map((key) => {
		const headerLen = capitalize(key).length
		let maxContentLen = headerLen
		let maxWordLen = headerLen
		for (const row of sampleRows) {
			maxContentLen = Math.max(maxContentLen, estimateContentLength(row[key]))
			maxWordLen = Math.max(maxWordLen, longestWord(row[key]))
		}
		const proportion = maxContentLen <= 6 ? 1 : maxContentLen <= 15 ? 2 : 3
		const minWidth = Math.max(Math.max(headerLen, maxWordLen) * PX_PER_CHAR, MIN_COLUMN_FLOOR)
		return { key, header: capitalize(key), width: proportional(proportion, { minWidth }) }
	})
}
