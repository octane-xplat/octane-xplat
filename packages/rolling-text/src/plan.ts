import { matchUnits } from './match'

export type CellPhase = 'stable' | 'enter' | 'exit'

export interface CellState {
	id: number
	unit: string
	phase: CellPhase
	/** Position within the committed unit list — stale on exit cells. */
	index: number
}

/** Non-exit cells in array order are exactly the committed unit list. */
export function committedUnits(cells: CellState[]): string[] {
	return cells.filter((cell) => cell.phase !== 'exit').map((cell) => cell.unit)
}

/**
 * Reconcile rendered cells against the next unit list (Scritto matching +
 * slot-text retained exits). The committed cells — non-exit cells in array
 * order — form the previous unit list. Survivors keep their id and rest in
 * place; unmatched committed cells become exit ghosts that keep their slot
 * until their roll finishes; entering cells insert before the survivor that
 * follows them in the new order, or at the end when none follows. The match
 * is monotone, so survivors never reorder.
 */
export function planCells(
	cells: CellState[],
	nextUnits: string[],
	alloc: () => number,
): CellState[] {
	const prevUnits = committedUnits(cells)
	const match = matchUnits(prevUnits, nextUnits)
	const matchedOld = new Map<number, number>()
	for (let ni = 0; ni < match.length; ni++) {
		const oi = match[ni]
		if (oi >= 0) {
			matchedOld.set(oi, ni)
		}
	}

	type Item = { cell: CellState; newIndex: number | null }
	const retained: Item[] = []
	let oldIndex = -1
	for (const cell of cells) {
		if (cell.phase === 'exit') {
			retained.push({ cell, newIndex: null })
			continue
		}

		oldIndex++
		const ni = matchedOld.get(oldIndex)
		retained.push(
			ni === undefined
				? { cell: { ...cell, phase: 'exit' }, newIndex: null }
				: { cell: { ...cell, phase: 'stable', index: ni }, newIndex: ni },
		)
	}

	// Group entering cells by the survivor that follows them in the new order.
	const anchors = new Map<number, CellState[]>()
	const tail: CellState[] = []
	const survivorNewIndexes = retained
		.filter((item) => item.newIndex !== null)
		.map((item) => item.newIndex)

	for (let ni = 0; ni < nextUnits.length; ni++) {
		if (match[ni] >= 0) {
			continue
		}

		const cell: CellState = { id: alloc(), unit: nextUnits[ni], phase: 'enter', index: ni }
		const anchor = survivorNewIndexes.find((index) => index !== null && index > ni)
		if (anchor === undefined || anchor === null) {
			tail.push(cell)
		} else {
			const list = anchors.get(anchor) ?? []
			list.push(cell)
			anchors.set(anchor, list)
		}
	}

	const out: CellState[] = []
	for (const item of retained) {
		if (item.newIndex !== null) {
			const pending = anchors.get(item.newIndex)
			if (pending) {
				out.push(...pending)
			}
		}

		out.push(item.cell)
	}

	out.push(...tail)
	return out
}

/** Every non-exit cell becomes stable; exit ghosts drop at once. Used when a
 *  run is interrupted or reduced-motion settles the committed target. */
export function snapCells(cells: CellState[]): CellState[] {
	return cells
		.filter((cell) => cell.phase !== 'exit')
		.map((cell) => (cell.phase === 'stable' ? cell : { ...cell, phase: 'stable' as const }))
}

/** Recommit `nextUnits` with every change shown instantly — reduced-motion
 *  commits and unit-mode rebuilds. */
export function settleCells(
	cells: CellState[],
	nextUnits: string[],
	alloc: () => number,
): CellState[] {
	return snapCells(planCells(cells, nextUnits, alloc))
}

/** Initial mount: the starting value renders settled, no roll. */
export function initialCells(units: string[], alloc: () => number): CellState[] {
	return units.map((unit, index) => ({ id: alloc(), unit, phase: 'stable', index }))
}
