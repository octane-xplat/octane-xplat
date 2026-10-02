import { describe, expect, it } from 'vitest'
import { dragTarget, moveColumn, resizedWidth } from './grid-layout'

describe('column gesture geometry', () => {
	it('moves across variable-width midpoints in either direction', () => {
		const columns = [
			{ id: 'a', getSize: () => 100 },
			{ id: 'b', getSize: () => 200 },
			{ id: 'c', getSize: () => 80 },
		]

		expect(dragTarget(columns, 'a', 149)).toBe('a')
		expect(dragTarget(columns, 'a', 150)).toBe('b')
		expect(dragTarget(columns, 'a', 290)).toBe('c')
		expect(dragTarget(columns, 'c', -140)).toBe('b')
		expect(dragTarget(columns, 'c', -290)).toBe('a')
		expect(dragTarget(columns, 'a', Number.NaN)).toBe('a')
	})

	it('keeps hidden IDs in the complete order and rejects missing targets', () => {
		const order = ['a', 'hidden', 'b']
		expect(moveColumn(order, 'a', 'b')).toEqual(['hidden', 'b', 'a'])
		expect(order).toEqual(['a', 'hidden', 'b'])
		expect(moveColumn(order, 'missing', 'b')).toBe(order)
	})

	it('clamps to both configured size bounds', () => {
		const column = { columnDef: { minSize: 80, maxSize: 180 } }
		expect(resizedWidth(column, 10)).toBe(80)
		expect(resizedWidth(column, 500)).toBe(180)
	})
})
