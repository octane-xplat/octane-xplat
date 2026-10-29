import { expect, it } from 'vitest'
import { absoluteFilterText, absoluteFilterValue } from './power-search-absolute-date.macos'

it('retains unchanged time, sub-millisecond source precision and expanded years', () => {
	for (const unixSeconds of [1234567890.12345, -0.00001, Date.parse('+010000-06-01T12:34:56.789Z') / 1000]) {
		const original = { type: 'date_absolute' as const, unixSeconds }
		const text = absoluteFilterText(unixSeconds)
		expect(absoluteFilterValue(text, { type: 'date_absolute' }, original).value).toEqual(original)
	}
})
it('accepts valid UTC date/date-time replacements without rounding away seconds/milliseconds', () => {
	for (const [text, iso] of [['2024-02-29', '2024-02-29T00:00:00.000Z'], ['2026-10-29 12:30', '2026-10-29T12:30:00.000Z'], ['2026-10-29T12:30:01.12Z', '2026-10-29T12:30:01.120Z']]) {
		expect(absoluteFilterValue(text, { type: 'date_absolute' }).value?.unixSeconds).toBe(Date.parse(iso) / 1000)
	}
})
it('rejects calendar rollover, blank, ambiguous, partial, out-of-range and offset text', () => {
	for (const text of ['', '2023-02-29', '2024-04-31', '10/29/2026', '2026-10', '2026-10-29T24:00Z', '2026-10-29T12:30:60Z', '2026-10-29T12:30+01:00', '2026-10-29junk', '10000-01-01']) {
		expect(absoluteFilterValue(text, { type: 'date_absolute' }).value).toBeNull()
	}
})
it('date-only deliberately drops time to midnight UTC and rejects typed time components', () => {
	const unixSeconds = Date.parse('2026-10-29T12:30:01.123Z') / 1000
	expect(absoluteFilterText(unixSeconds, true)).toBe('2026-10-29')
	expect(absoluteFilterValue('2026-10-29', { type: 'date_absolute', isDateOnly: true }, { type: 'date_absolute', unixSeconds }).value?.unixSeconds).toBe(Date.parse('2026-10-29T00:00:00Z') / 1000)
	for (const text of ['2026-10-29T00:00Z', '2026-10-29 00:00', '2026-02-30']) expect(absoluteFilterValue(text, { type: 'date_absolute', isDateOnly: true }).value).toBeNull()
})
it('date-only handles stored expanded years and pre-epoch sub-millisecond days without truncation rollover', () => {
	for (const [unixSeconds, text, midnight] of [[Date.parse('+010000-06-01T12:34:56.789Z') / 1000, '+010000-06-01', Date.parse('+010000-06-01T00:00:00Z') / 1000], [-0.00001, '1969-12-31', -86400]] as const) {
		expect(absoluteFilterText(unixSeconds, true)).toBe(text)
		expect(absoluteFilterValue(text, { type: 'date_absolute', isDateOnly: true }, { type: 'date_absolute', unixSeconds }).value?.unixSeconds).toBe(midnight)
	}
})
it('invalid stored instants are editable errors, never render exceptions or saved NaN', () => {
	for (const unixSeconds of [NaN, Infinity, 1e30]) {
		const original = { type: 'date_absolute' as const, unixSeconds }
		expect(absoluteFilterText(unixSeconds)).toBe('')
		expect(absoluteFilterValue('', { type: 'date_absolute' }, original).value).toBeNull()
		expect(absoluteFilterValue('2024-02-29', { type: 'date_absolute' }, original).value).not.toBeNull()
	}
})
