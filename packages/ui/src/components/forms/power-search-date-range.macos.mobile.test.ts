import { expect, it } from 'vitest'
import { rangeDraft, rangePartDraft, rangeValue } from './power-search-date-range.macos'

it('keeps NOW semantic and resolves both endpoints against one instant', () => {
	const draft = rangeDraft()
	expect(rangeValue(draft, 100.9).value).toEqual({ start: { type: 'NOW' }, end: { type: 'NOW' } })
	draft.start = { ...draft.start, kind: 'RELATIVE', amount: '2', unit: 'day' }
	expect(rangeValue(draft, 100).value?.start).toEqual({ type: 'RELATIVE', backValue: 2, unit: 'day' })
})
it('accepts UTC dates and date-times while rejecting rollover, malformed and ambiguous input', () => {
	for (const [text, expected] of [['2024-02-29', '2024-02-29T00:00:00.000Z'], ['2024-02-29 12:30', '2024-02-29T12:30:00.000Z'], ['2024-02-29T12:30:01.12Z', '2024-02-29T12:30:01.120Z']]) {
		const draft = rangeDraft(); draft.start = { ...draft.start, kind: 'ABSOLUTE', instant: text }
		expect(rangeValue(draft, 2e9).value?.start).toEqual({ type: 'ABSOLUTE', unixSeconds: Date.parse(expected) / 1000 })
	}
	for (const instant of ['', '02/03/2024', '2023-02-29', '2024-04-31', '2024-01-01T24:00Z', '2024-01-01T12:00:60Z', '2024-01-01T12:00+01:00', '2024-01-01T12:00junk']) {
		const draft = rangeDraft(); draft.start = { ...draft.start, kind: 'ABSOLUTE', instant }
		expect(rangeValue(draft, 2e9).value).toBeNull()
	}
})
it('preserves no-op absolute precision and expanded years without rounding stored data', () => {
	for (const unixSeconds of [1234567890.12345, Date.parse('+010000-01-01T00:00:00.000Z') / 1000]) {
		const draft = rangeDraft({ start: { type: 'ABSOLUTE', unixSeconds }, end: { type: 'ABSOLUTE', unixSeconds } })
		expect(rangeValue(draft).value?.start).toEqual({ type: 'ABSOLUTE', unixSeconds })
	}
})
it('supports signed/fractional relative values and retains opaque anchor keys', () => {
	const draft = rangeDraft()
	draft.end = { ...draft.end, kind: 'RELATIVE', amount: '-1.5', unit: 'hour', anchorKey: 'custom-anchor' }
	expect(rangeValue(draft, 100).value?.end).toEqual({ type: 'RELATIVE', backValue: -1.5, unit: 'hour', anchorKey: 'custom-anchor' })
	for (const amount of ['', 'NaN', 'Infinity', '1e999', '1junk', '--1']) {
		draft.end.amount = amount; expect(rangeValue(draft).value).toBeNull()
	}
	draft.end.amount = '-1e-3'; expect(rangeValue(draft, 100).value?.end).toMatchObject({ backValue: -0.001 })
	draft.end.amount = '0'; draft.end.unit = 'fortnight'; expect(rangeValue(draft).value).toBeNull()
})
it('rejects reversed and overflowing ranges at the current validation instant', () => {
	const draft = rangeDraft({ start: { type: 'ABSOLUTE', unixSeconds: 200 }, end: { type: 'NOW' } })
	expect(rangeValue(draft, 199).value).toBeNull(); expect(rangeValue(draft, 200).value).not.toBeNull()
	draft.start = { ...rangePartDraft({ type: 'RELATIVE', backValue: 1e308, unit: 'year' }) }
	expect(rangeValue(draft, 200).value).toBeNull()
})
it('copies interval presets without mutating their stored parts or introducing arbitrary defaults', () => {
	const preset = Object.freeze({ start: Object.freeze({ type: 'RELATIVE' as const, backValue: 7, unit: 'day' as const, anchorKey: 'kept' }), end: Object.freeze({ type: 'NOW' as const }) })
	const draft = rangeDraft(preset); draft.start.amount = '3'
	expect(preset.start.backValue).toBe(7)
	expect(rangeValue(draft).value?.start).toEqual({ type: 'RELATIVE', backValue: 3, unit: 'day', anchorKey: 'kept' })
})
it('invalid stored absolute values are editable errors rather than render-time exceptions', () => {
	for (const unixSeconds of [NaN, Infinity, 1e30]) {
		const draft = rangeDraft({ start: { type: 'ABSOLUTE', unixSeconds }, end: { type: 'NOW' } })
		expect(draft.start.instant).toBe(''); expect(rangeValue(draft).value).toBeNull()
	}
})
