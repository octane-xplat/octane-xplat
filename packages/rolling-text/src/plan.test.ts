import { describe, expect, it } from 'vitest'
import {
	committedUnits,
	initialCells,
	planCells,
	settleCells,
	snapCells,
	type CellState,
} from './plan'

const alloc = () => {
	let next = 0
	return () => ++next
}

const byPhase = (cells: CellState[], phase: CellState['phase']) =>
	cells.filter((cell) => cell.phase === phase)

describe('planCells', () => {
	it('keeps survivor identity and marks unmatched cells', () => {
		const next = alloc()
		const cells = initialCells('9 seconds'.split(''), next)
		const planned = planCells(cells, '10 seconds'.split(''), next)

		expect(committedUnits(planned).join('')).toBe('10 seconds')
		// ' seconds' survivors keep their ids.
		const survivors = byPhase(planned, 'stable')
		expect(survivors.map((c) => c.id)).toEqual(cells.slice(1).map((c) => c.id))
		expect(byPhase(planned, 'exit').map((c) => c.unit)).toEqual(['9'])
		expect(byPhase(planned, 'enter').map((c) => c.unit)).toEqual(['1', '0'])
		// Enter cells sit before the first survivor; the ghost keeps its slot.
		expect(planned[0].unit).toBe('9')
		expect(planned[0].phase).toBe('exit')
		expect(planned[1].unit).toBe('1')
		expect(planned[2].unit).toBe('0')
	})

	it('keeps prior exit ghosts in place across a second plan', () => {
		const next = alloc()
		const cells = initialCells('ab'.split(''), next)
		const once = planCells(cells, 'cd'.split(''), next)
		const twice = planCells(once, 'ef'.split(''), next)
		expect(committedUnits(twice).join('')).toBe('ef')
		// Both generations of ghosts linger until their own exits finish.
		expect(byPhase(twice, 'exit').length).toBe(4)
	})

	it('snapCells drops exits and settles enters', () => {
		const next = alloc()
		const cells = planCells(initialCells('ab'.split(''), next), 'cd'.split(''), next)
		const snapped = snapCells(cells)
		expect(snapped.every((c) => c.phase === 'stable')).toBe(true)
		expect(snapped.map((c) => c.unit).join('')).toBe('cd')
	})

	it('settleCells commits the next value instantly, preserving matched ids', () => {
		const next = alloc()
		const cells = initialCells('a1b'.split(''), next)
		const settled = settleCells(cells, 'a2b'.split(''), next)
		expect(settled.map((c) => c.unit).join('')).toBe('a2b')
		expect(settled.every((c) => c.phase === 'stable')).toBe(true)
		expect(settled[0].id).toBe(cells[0].id)
		expect(settled[2].id).toBe(cells[2].id)
	})
})
