import { describe, expect, it } from 'vitest'
import { characterCount, createStaticSource, groupTypeaheadItems } from './typeahead-source'

describe('Typeahead search source', () => {
	it('matches labels and optional keywords case-insensitively', () => {
		const items = [
			{ id: 'nyc', label: 'New York' },
			{ id: 'sfo', label: 'San Francisco' },
		]
		const source = createStaticSource(items, { keywords: (item) => [item.id] })

		expect(source.search('  YORK ')).toEqual([items[0]])
		expect(source.search('SFO')).toEqual([items[1]])
		expect(source.search('')).toEqual(items)
		expect(source.bootstrap()).toEqual(items)
	})

	it('counts grapheme clusters and groups results in stable order', () => {
		const items = [
			{ id: 'u', label: 'Other' },
			{ id: 'a', label: 'A', auxiliaryData: { group: 'First' } },
			{ id: 'b', label: 'B', auxiliaryData: { group: 'Second' } },
			{ id: 'c', label: 'C', auxiliaryData: { group: 'First' } },
		]

		expect(characterCount('👨‍👩‍👧‍👦')).toBe(1)
		expect(groupTypeaheadItems(items, { ungroupedFirst: true })).toEqual([
			{ heading: null, items: [items[0]] },
			{ heading: 'First', items: [items[1], items[3]] },
			{ heading: 'Second', items: [items[2]] },
		])
	})
})
