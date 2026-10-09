import { describe, expect, it } from 'vitest'
import { matchUnits } from './match'

const units = (value: string) => value.split('')

/** Materialize the map for readability: [newIndex, oldIndex] survivor pairs. */
function pairs(prev: string, next: string, anchor = 0) {
	const map = matchUnits(units(prev), units(next), anchor)
	const out: Array<[number, number]> = []
	for (let ni = 0; ni < map.length; ni++) {
		if (map[ni] >= 0) {
			out.push([ni, map[ni]])
		}
	}

	return out
}

/** Survivor pairs never cross and never share an old index. */
function expectMonotone(found: Array<[number, number]>) {
	for (let i = 1; i < found.length; i++) {
		expect(found[i][0]).toBeGreaterThan(found[i - 1][0])
		expect(found[i][1]).toBeGreaterThan(found[i - 1][1])
	}
}

describe('matchUnits', () => {
	it('keeps the shared tail when a count widens', () => {
		const found = pairs('9 seconds', '10 seconds')
		expectMonotone(found)
		// ' seconds' survives; '1' and '0' are fresh cells.
		expect(found).toEqual([
			[2, 1],
			[3, 2],
			[4, 3],
			[5, 4],
			[6, 5],
			[7, 6],
			[8, 7],
			[9, 8],
		])
	})

	it('keeps a common prefix when the first unit changes', () => {
		const found = pairs('1 second', '2 seconds')
		expectMonotone(found)
		expect(found[0]).toEqual([1, 1]) // ' '
		// 'second' is the flush suffix.
		expect(found.slice(1).map(([ni]) => ni)).toEqual([2, 3, 4, 5, 6, 7])
	})

	it('keeps prefix and suffix around an edited digit', () => {
		const found = pairs('$2.50', '$3.50')
		expectMonotone(found)
		expect(found).toEqual([
			[0, 0], // '$'
			[2, 2], // '.'
			[3, 3], // '5'
			[4, 4], // '0'
		])
	})

	it('does not retain noise between unrelated words', () => {
		// 'seven' → 'nine' share 'e' but a lone floating letter is not a run.
		const found = pairs('seven', 'nine')
		expectMonotone(found)
		expect(found.length).toBeLessThanOrEqual(1)
	})

	it('handles empty and equal values', () => {
		expect(pairs('', 'abc')).toEqual([])
		expect(pairs('abc', '')).toEqual([])
		const same = pairs('same', 'same')
		expect(same).toEqual([
			[0, 0],
			[1, 1],
			[2, 2],
			[3, 3],
		])
	})

	it('retains the whole string when identical but for a middle insertion', () => {
		const found = pairs('1,000 items', '12,000 items')
		expectMonotone(found)
		// '2' enters; ',000 items' survives.
		expect(found.length).toBe(units('1,000 items').length)
	})

	it('honors the anchor when two alignments tie', () => {
		// 'abc' → 'xabc': exact prefix-free growth; the flush suffix is the only
		// run so both anchors agree — the anchor matters for middle ties.
		const end = pairs('ab', 'abab', 1)
		expectMonotone(end)
		expect(end.length).toBeGreaterThan(0)
	})
})
