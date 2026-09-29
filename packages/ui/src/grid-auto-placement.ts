import type { GridChildPlacement } from './grid-placement'

export interface GridCell {
	row: number
	col: number
}

export interface GridAutoPlacement {
	cells: GridCell[]
	rowCount: number
	columnCount: number
}

function gridIndex(value: unknown): number | null {
	if (value == null || value === '') return null
	const index = Number(value)
	return Number.isInteger(index) && index >= 0 ? index : null
}

function gridSpan(value: unknown): number {
	const span = Number(value)
	return Number.isInteger(span) && span > 0 ? span : 1
}

function trackCount(spec?: string): number {
	return spec?.split(',').filter((track) => track.trim().length > 0).length ?? 0
}

/** Match CSS Grid's row-flow placement for NativeScript GridLayout children. */
export function autoPlaceGridChildren(
	items: readonly GridChildPlacement[],
	rowTracks?: string,
	columnTracks?: string,
): GridAutoPlacement {
	const placements = items.map((item) => ({
		row: gridIndex(item.row),
		col: gridIndex(item.col),
		rowSpan: gridSpan(item.rowSpan),
		colSpan: gridSpan(item.colSpan),
	}))
	const columnCount = Math.max(
		1,
		trackCount(columnTracks),
		...placements
			.filter((placement) => placement.col != null)
			.map((placement) => placement.col! + placement.colSpan),
		...placements.map((placement) => placement.colSpan),
	)
	const occupied = new Set<string>()
	const isFree = (row: number, col: number, rowSpan: number, colSpan: number) => {
		for (let y = row; y < row + rowSpan; y++) {
			for (let x = col; x < col + colSpan; x++) {
				if (occupied.has(`${y},${x}`)) return false
			}
		}
		return true
	}
	const occupy = (row: number, col: number, rowSpan: number, colSpan: number) => {
		for (let y = row; y < row + rowSpan; y++) {
			for (let x = col; x < col + colSpan; x++) occupied.add(`${y},${x}`)
		}
	}

	// Definite placements reserve their cells before automatic items flow.
	for (const placement of placements) {
		if (placement.row != null && placement.col != null) {
			occupy(placement.row, placement.col, placement.rowSpan, placement.colSpan)
		}
	}

	for (const placement of placements) {
		if (placement.row == null || placement.col != null) continue
		let col = 0
		while (!isFree(placement.row, col, placement.rowSpan, placement.colSpan)) col++
		placement.col = col
		occupy(placement.row, col, placement.rowSpan, placement.colSpan)
	}

	for (const placement of placements) {
		if (placement.col == null || placement.row != null) continue
		let row = 0
		while (!isFree(row, placement.col, placement.rowSpan, placement.colSpan)) row++
		placement.row = row
		occupy(row, placement.col, placement.rowSpan, placement.colSpan)
	}

	let cursorRow = 0
	let cursorCol = 0
	for (const placement of placements) {
		if (placement.row != null && placement.col != null) continue
		while (true) {
			if (cursorCol + placement.colSpan > columnCount) {
				cursorRow++
				cursorCol = 0
				continue
			}
			if (isFree(cursorRow, cursorCol, placement.rowSpan, placement.colSpan)) break
			cursorCol++
		}
		placement.row = cursorRow
		placement.col = cursorCol
		occupy(cursorRow, cursorCol, placement.rowSpan, placement.colSpan)
		cursorCol += placement.colSpan
		if (cursorCol >= columnCount) {
			cursorRow++
			cursorCol = 0
		}
	}

	return {
		cells: placements.map(({ row, col }) => ({ row: row!, col: col! })),
		rowCount: Math.max(trackCount(rowTracks), ...placements.map((item) => item.row! + item.rowSpan)),
		columnCount: Math.max(columnCount, ...placements.map((item) => item.col! + item.colSpan)),
	}
}

export function ensureGridTracks(spec: string | undefined, requiredCount: number): string {
	const tracks = spec?.split(',').map((track) => track.trim()).filter(Boolean) ?? []
	while (tracks.length < requiredCount) tracks.push('auto')
	return tracks.join(',')
}
