import { describe, expect, it } from 'vitest'
import { parseTimestampValue } from './time-format'
import type { ISOInstantString, TimestampProps } from './props'

const secondsTimestamp: TimestampProps = { value: 1_700_000_000, valueUnit: 'unix-seconds' }
const millisecondsTimestamp: TimestampProps = {
	value: 1_700_000_000,
	valueUnit: 'unix-milliseconds',
}

const instantTimestamp: TimestampProps = { value: '2026-10-01T12:00:00Z' }
// @ts-expect-error Numeric timestamps must state their unit.
const ambiguousTimestamp: TimestampProps = { value: 1_700_000_000 }

describe('Timestamp value units', () => {
	it('interprets numeric values only in their declared unit', () => {
		expect(
			parseTimestampValue(
				secondsTimestamp.value as number,
				secondsTimestamp.valueUnit!,
			).toISOString(),
		).toBe('2023-11-14T22:13:20.000Z')

		expect(
			parseTimestampValue(
				millisecondsTimestamp.value as number,
				millisecondsTimestamp.valueUnit!,
			).toISOString(),
		).toBe('1970-01-20T16:13:20.000Z')
	})

	it('accepts zone-bearing instants and rejects local date-times', () => {
		expect(parseTimestampValue(instantTimestamp.value as ISOInstantString).toISOString()).toBe(
			'2026-10-01T12:00:00.000Z',
		)

		expect(
			Number.isNaN(parseTimestampValue('2026-10-01T12:00:00' as ISOInstantString).getTime()),
		).toBe(true)
	})
})

void ambiguousTimestamp
