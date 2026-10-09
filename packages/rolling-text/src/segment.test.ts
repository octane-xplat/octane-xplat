import { afterEach, describe, expect, it } from 'vitest'
import { segmentUnits } from './segment'

const Segmenter = (Intl as any).Segmenter

afterEach(() => {
	;(Intl as any).Segmenter = Segmenter
})

describe('segmentUnits (grapheme)', () => {
	it('splits per user-perceived character', () => {
		expect(segmentUnits('abc')).toEqual(['a', 'b', 'c'])
		expect(segmentUnits('')).toEqual([])
	})

	it('keeps combining marks and joined emoji whole', () => {
		const composed = segmentUnits('é') // e + combining acute
		expect(composed).toEqual(['é'])
		const family = segmentUnits('👨‍👩‍👧')
		expect(family).toEqual(['👨‍👩‍👧'])
	})

	it('falls back to whole-label for non-ASCII without Intl.Segmenter', () => {
		;(Intl as any).Segmenter = undefined
		expect(segmentUnits('ab')).toEqual(['a', 'b'])
		// A joined emoji sequence must never split silently.
		expect(segmentUnits('👨‍👩‍👧')).toEqual(['👨‍👩‍👧'])
		expect(segmentUnits('é')).toEqual(['é'])
	})
})

describe('segmentUnits (word)', () => {
	it('groups a word with its trailing spaces', () => {
		expect(segmentUnits('9 seconds', 'word')).toEqual(['9 ', 'seconds'])
		expect(segmentUnits('a  b', 'word')).toEqual(['a  ', 'b'])
	})

	it('keeps whitespace-only runs as their own units', () => {
		expect(segmentUnits('  lead', 'word')[0]).toBe('  ')
	})

	it('splits at whitespace without a segmenter', () => {
		;(Intl as any).Segmenter = undefined
		expect(segmentUnits('9 seconds', 'word')).toEqual(['9 ', 'seconds'])
		expect(segmentUnits('👨‍👩‍👧 ok', 'word')).toEqual(['👨‍👩‍👧 ', 'ok'])
	})
})
