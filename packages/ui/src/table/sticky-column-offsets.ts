// Sticky-column offset math — port of upstream
// plugins/stickyColumns/useTableStickyColumns.tsx (Astryx 0.6.4, MIT).
// Platform-neutral; the web leaf consumes it for inline offsets, tests
// exercise it directly.

import type { TableColumn } from '../props'
import { DEFAULT_MIN_COLUMN_WIDTH } from './column-utils'

/**
 * Resolve a column's pixel width for cumulative offset math. Mirrors the
 * resize plugin's fallback so offsets line up with rendered widths:
 * pixel columns use their value; proportional columns use their declared
 * minWidth (or the default); unknown widths use the default.
 */
export function getStickyColumnWidth<T extends Record<string, unknown>>(col: TableColumn<T>): number {
	const w = col.width
	if (!w) {
		return DEFAULT_MIN_COLUMN_WIDTH
	}
	if (w.type === 'pixel') {
		return w.value
	}
	return w.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH
}

/**
 * Columns pinned to the START edge → cumulative inline offset (px). The pinned
 * block is the contiguous run from column 0 through the last key in `startKeys`
 * (inclusive of any synthetic columns before it). `null` if none / no context.
 */
export function computeStickyStartOffsets<T extends Record<string, unknown>>(
	columns: ReadonlyArray<TableColumn<T>> | undefined,
	startKeys: string[],
): Map<string, number> | null {
	if (!columns || columns.length === 0 || startKeys.length === 0) {
		return null
	}
	let lastStickyIndex = -1
	for (let i = 0; i < columns.length; i++) {
		if (startKeys.includes(columns[i]!.key)) {
			lastStickyIndex = i
		}
	}
	if (lastStickyIndex === -1) {
		return null
	}
	const offsets = new Map<string, number>()
	let cumulative = 0
	for (let i = 0; i <= lastStickyIndex; i++) {
		offsets.set(columns[i]!.key, cumulative)
		cumulative += getStickyColumnWidth(columns[i]!)
	}
	return offsets
}

/**
 * Mirror of {@link computeStickyStartOffsets} for the END edge — contiguous run
 * from the first key in `endKeys` through the last column, offsets accumulating
 * from the end (last column = 0). `null` if none.
 */
export function computeStickyEndOffsets<T extends Record<string, unknown>>(
	columns: ReadonlyArray<TableColumn<T>> | undefined,
	endKeys: string[],
): Map<string, number> | null {
	if (!columns || columns.length === 0 || endKeys.length === 0) {
		return null
	}
	let firstStickyIndex = -1
	for (let i = 0; i < columns.length; i++) {
		if (endKeys.includes(columns[i]!.key)) {
			firstStickyIndex = i
			break
		}
	}
	if (firstStickyIndex === -1) {
		return null
	}
	const offsets = new Map<string, number>()
	let cumulative = 0
	for (let i = columns.length - 1; i >= firstStickyIndex; i--) {
		offsets.set(columns[i]!.key, cumulative)
		cumulative += getStickyColumnWidth(columns[i]!)
	}
	return offsets
}

export type StickySide = { edge: 'start' | 'end'; offset: number }

/**
 * Resolve how a single column should be pinned given the start/end configs and
 * the full column list. A key (mis)configured on both edges resolves to start.
 * Returns `null` for columns that should not be pinned.
 */
export function resolveStickySide<T extends Record<string, unknown>>(
	columns: ReadonlyArray<TableColumn<T>> | undefined,
	columnKey: string,
	startKeys: string[],
	endKeys: string[],
): StickySide | null {
	const startOffsets = computeStickyStartOffsets(columns, startKeys)
	if (startOffsets?.has(columnKey)) {
		return { edge: 'start', offset: startOffsets.get(columnKey) ?? 0 }
	}
	const endOffsets = computeStickyEndOffsets(columns, endKeys)
	if (endOffsets?.has(columnKey)) {
		return { edge: 'end', offset: endOffsets.get(columnKey) ?? 0 }
	}
	return null
}
