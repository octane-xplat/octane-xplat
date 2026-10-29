import { afterEach, expect, it, vi } from 'vitest'
import { sortTableData } from '../../table/use-table-sortable-state'
import { characterCount } from '../forms/typeahead-source'
import { getLocaleDirection } from '../../internal/platform/internationalization'

const nativeIntl = Intl
afterEach(() => vi.unstubAllGlobals())
const rows = [{ name: 'item10' }, { name: 'item2' }]
const sort = () => sortTableData(rows, [{ sortKey: 'name', direction: 'ascending' }], undefined)

it.each([undefined, {}])('keeps optional UI behavior usable with Intl=%j', (intl) => {
	vi.stubGlobal('Intl', intl)
	expect(sort().map((row) => row.name)).toEqual(['item2', 'item10'])
	expect(characterCount('😀')).toBe(1)
	expect(characterCount('e\u0301')).toBe(2)
	expect(getLocaleDirection('ar-EG')).toBe('rtl')
	expect(getLocaleDirection('en')).toBe('ltr')
})

it('uses newly installed capabilities after an initial fallback', () => {
	vi.stubGlobal('Intl', {})
	sort()
	expect(characterCount('e\u0301')).toBe(2)
	const compare = vi.fn((a: string, b: string) => (b < a ? -1 : 1))
	class Collator {
		compare = compare
	}
	vi.stubGlobal('Intl', { Collator, Segmenter: nativeIntl.Segmenter })
	expect(sort().map((row) => row.name)).toEqual(['item2', 'item10'])
	expect(compare).toHaveBeenCalled()
	expect(characterCount('e\u0301')).toBe(1)
	// Removing just Collator must restore the fallback, despite the cached instance.
	vi.stubGlobal('Intl', { Segmenter: nativeIntl.Segmenter })
	expect(sort().map((row) => row.name)).toEqual(['item2', 'item10'])
})
