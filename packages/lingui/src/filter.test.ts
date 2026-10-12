import { describe, expect, it } from 'vitest'

import { createFilter } from './hooks'

const base = createFilter(new Intl.Collator('en', { usage: 'search', sensitivity: 'base' }))
const variant = createFilter(new Intl.Collator('en', { usage: 'search', sensitivity: 'variant' }))

describe('createFilter', () => {
	it('contains matches ignoring case and diacritics at base sensitivity', () => {
		expect(base.contains('Frédéric Chopin', 'frederic')).toBe(true)
		expect(base.contains('Frédéric Chopin', 'FREDERIC')).toBe(true)
		expect(base.contains('Johann Sebastian Bach', 'sebastian b')).toBe(true)
		expect(base.contains('Johann Sebastian Bach', 'haydn')).toBe(false)
	})

	it('respects variant sensitivity', () => {
		expect(variant.contains('Frédéric', 'frederic')).toBe(false)
		expect(variant.contains('Frédéric', 'Frédéric')).toBe(true)
		expect(variant.contains('Frédéric', 'FrÉdÉric')).toBe(false)
	})

	it('matches prefixes and suffixes', () => {
		expect(base.startsWith('Wolfgang Amadeus Mozart', 'wolfgang')).toBe(true)
		expect(base.startsWith('Wolfgang Amadeus Mozart', 'amadeus')).toBe(false)
		expect(base.endsWith('Wolfgang Amadeus Mozart', 'mozart')).toBe(true)
		expect(base.endsWith('Wolfgang Amadeus Mozart', 'amadeus')).toBe(false)
	})

	it('treats an empty needle as a match', () => {
		expect(base.contains('anything', '')).toBe(true)
		expect(base.startsWith('anything', '')).toBe(true)
		expect(base.endsWith('anything', '')).toBe(true)
	})
})
