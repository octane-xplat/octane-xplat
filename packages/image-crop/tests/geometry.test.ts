import { describe, it, expect } from 'vitest'
import {
	containFrame,
	constrainCrop,
	convertToPercentCrop,
	convertToPixelCrop,
	dragCrop,
	fromNaturalCrop,
	toNaturalCrop,
} from '../src/geometry'

import type { CropHandle, PixelCrop } from '../src/props'
const size = { width: 400, height: 300 }
const start: PixelCrop = { unit: 'px', x: 100, y: 80, width: 120, height: 80 }
describe('selection geometry', () => {
	it('excludes contain letterboxing and maps natural pixels in both directions', () => {
		expect(containFrame({ width: 400, height: 400 }, { width: 800, height: 400 })).toEqual({
			x: 0,
			y: 100,
			width: 400,
			height: 200,
		})

		const natural = toNaturalCrop(start, size, { width: 800, height: 600 })
		expect(natural).toEqual({ unit: 'px', x: 200, y: 160, width: 240, height: 160 })
		expect(fromNaturalCrop(natural, { width: 800, height: 600 }, size)).toEqual(start)
	})

	it('keeps percentage units relative to each displayed image axis', () => {
		expect(convertToPixelCrop({ unit: '%', x: 25, y: 10, width: 50, height: 50 }, size)).toEqual({
			unit: 'px',
			x: 100,
			y: 30,
			width: 200,
			height: 150,
		})

		expect(
			convertToPercentCrop(
				convertToPixelCrop({ unit: '%', x: 25, y: 10, width: 50, height: 50 }, size),
				size,
			),
		).toEqual({ unit: '%', x: 25, y: 10, width: 50, height: 50 })
	})

	it('moves without resizing and clamps all image edges', () => {
		expect(dragCrop(start, 'move', -1000, 1000, size)).toEqual({ ...start, x: 0, y: 220 })
	})

	it('anchors the opposite corner and stops at minimum sizes without flipping', () => {
		expect(dragCrop(start, 'nw', 1000, 1000, size, { minWidth: 40, minHeight: 30 })).toEqual({
			unit: 'px',
			x: 180,
			y: 130,
			width: 40,
			height: 30,
		})

		expect(dragCrop(start, 'se', 1000, 1000, size)).toEqual({
			unit: 'px',
			x: 100,
			y: 80,
			width: 300,
			height: 220,
		})
	})

	it('keeps every handle bounded with aspect, min and max constraints', () => {
		for (const handle of ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as CropHandle[]) {
			for (const dx of [-1000, -20, 0, 20, 1000]) {
				for (const dy of [-1000, -20, 0, 20, 1000]) {
					const result = dragCrop(start, handle, dx, dy, size, {
						aspect: 1.5,
						minWidth: 30,
						minHeight: 20,
						maxWidth: 200,
						maxHeight: 140,
					})

					expect(result.width / result.height).toBeCloseTo(1.5)
					expect(result.x).toBeGreaterThanOrEqual(0)
					expect(result.y).toBeGreaterThanOrEqual(0)
					expect(result.x + result.width).toBeLessThanOrEqual(400)
					expect(result.y + result.height).toBeLessThanOrEqual(300)
					expect(result.width).toBeGreaterThanOrEqual(30)
					expect(result.width).toBeLessThanOrEqual(200)
				}
			}
		}
	})

	it('expands side handles symmetrically on the other axis with aspect lock', () => {
		expect(dragCrop(start, 'e', 30, 0, size, { aspect: 1.5 })).toEqual({
			unit: 'px',
			x: 100,
			y: 70,
			width: 150,
			height: 100,
		})
	})

	it('handles zero layout and impossible minimums without NaN', () => {
		expect(constrainCrop(start, { width: 0, height: 0 }, { aspect: 2, minWidth: 100 })).toEqual({
			unit: 'px',
			x: 0,
			y: 0,
			width: 0,
			height: 0,
		})

		expect(convertToPercentCrop(start, { width: 0, height: 0 })).toEqual({
			unit: '%',
			x: 0,
			y: 0,
			width: 0,
			height: 0,
		})
	})
})
