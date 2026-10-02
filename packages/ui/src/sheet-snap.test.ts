import { describe, expect, it } from 'vitest'
import { detentOffset, normalizeDetents, snapDetentIndex } from './sheet-snap'

// Pure math behind the sheet detents: fractions → sorted snap points →
// resting translateY offsets → release-time snap targets. The DOM/NS
// attachments are thin adapters over this.

const D = [0.25, 0.5, 0.9]
const VH = 800

describe('normalizeDetents', () => {
	it('sorts, filters, and dedupes', () => {
		expect(normalizeDetents([0.9, 0.25, 0, 1.5, 0.25])).toEqual([0.25, 0.9])
		expect(normalizeDetents()).toEqual([])
		expect(normalizeDetents([0])).toEqual([])
	})
})

describe('detentOffset', () => {
	it('parks the largest-detent-sized panel per detent', () => {
		expect(detentOffset(D, 0, VH)).toBe((0.9 - 0.25) * VH)
		expect(detentOffset(D, 2, VH)).toBe(0)
	})
})

describe('snapDetentIndex', () => {
	it('snaps to the nearest detent on a slow release', () => {
		// frac 0.55 → detent 0.5 wins
		expect(snapDetentIndex((0.9 - 0.55) * VH, 0, D, VH)).toBe(1)
		expect(snapDetentIndex(0, 0, D, VH)).toBe(2) // fully open
	})

	it('dismisses below half of the smallest detent', () => {
		// frac 0.1 < 0.25/2
		expect(snapDetentIndex((0.9 - 0.1) * VH, 0, D, VH)).toBe(-1)
	})

	it('fling direction overrides proximity', () => {
		// frac 0.6 (nearer 0.5) flung up → 0.9
		expect(snapDetentIndex((0.9 - 0.6) * VH, -600, D, VH)).toBe(2)
		// frac 0.4 (nearer 0.5) flung down → 0.25
		expect(snapDetentIndex((0.9 - 0.4) * VH, 600, D, VH)).toBe(0)
		// flung down at/below the smallest detent → dismiss
		expect(snapDetentIndex((0.9 - 0.25) * VH, 600, D, VH)).toBe(-1)
	})
})
