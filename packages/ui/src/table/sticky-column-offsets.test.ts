import { describe, expect, it } from 'vitest'
import {
	computeStickyStartOffsets,
	computeStickyEndOffsets,
	getStickyColumnWidth,
	resolveStickySide,
} from './sticky-column-offsets'

import { pixel, proportional, DEFAULT_MIN_COLUMN_WIDTH } from './column-utils'
import type { TableColumn } from '../props'

const cols: TableColumn<Record<string, unknown>>[] = [
	{ key: 'a', width: pixel(100) },
	{ key: 'b', width: proportional(1, { minWidth: 140 }) },
	{ key: 'c', width: pixel(50) },
	{ key: 'd' }, // no width → DEFAULT_MIN_COLUMN_WIDTH
]

describe('sticky column offsets', () => {
	it('resolves widths: pixel value, proportional minWidth, default fallback', () => {
		expect(getStickyColumnWidth(cols[0]!)).toBe(100)
		expect(getStickyColumnWidth(cols[1]!)).toBe(140)
		expect(getStickyColumnWidth(cols[2]!)).toBe(50)
		expect(getStickyColumnWidth(cols[3]!)).toBe(DEFAULT_MIN_COLUMN_WIDTH)
	})

	it('start run: contiguous from column 0 through the last start key', () => {
		const offsets = computeStickyStartOffsets(cols, ['b'])!
		expect(offsets.get('a')).toBe(0)
		expect(offsets.get('b')).toBe(100)
		expect(offsets.has('c')).toBe(false)
	})

	it('start run includes every column before the last start key', () => {
		const offsets = computeStickyStartOffsets(cols, ['c'])!
		expect(offsets.get('a')).toBe(0)
		expect(offsets.get('b')).toBe(100)
		expect(offsets.get('c')).toBe(100 + 140)
	})

	it('end run: contiguous from the first end key through the last column', () => {
		const offsets = computeStickyEndOffsets(cols, ['c'])!
		expect(offsets.get('d')).toBe(0)
		expect(offsets.get('c')).toBe(DEFAULT_MIN_COLUMN_WIDTH)
		expect(offsets.has('b')).toBe(false)
	})

	it('returns null for empty configs / unknown keys', () => {
		expect(computeStickyStartOffsets(cols, [])).toBeNull()
		expect(computeStickyEndOffsets(cols, [])).toBeNull()
		expect(computeStickyStartOffsets(cols, ['nope'])).toBeNull()
		expect(computeStickyStartOffsets(undefined, ['a'])).toBeNull()
	})

	it('a key on both edges resolves to start', () => {
		const side = resolveStickySide(cols, 'c', ['a', 'c'], ['c'])
		expect(side).toEqual({ edge: 'start', offset: 100 + 140 })
	})
})
