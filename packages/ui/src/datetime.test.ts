import { describe, expect, it } from 'vitest'
import {
	adjustTime,
	combineDateTime,
	currentISOTime,
	effectivePresentation,
	formatDateValue,
	formatDisplayTime12h,
	formatISOTime,
	isTimeInRange,
	parseDateInput,
	parseISOTime,
	parseTimeInput,
	plainDateAddDays,
	plainDateAddMonths,
	plainDateFromISO,
	plainDateGetWeekNumber,
	plainDateToISO,
	splitDateTime,
} from './datetime'
import {
	applyRangePick,
	buildMonthGrid,
	computeDayCellState,
	createDateDisabledCheck,
	getInitialFocusDate,
	monthStart,
	navigationBounds,
} from './calendar-core'

describe('PlainDate math', () => {
	it('round-trips ISO parsing', () => {
		expect(plainDateToISO(plainDateFromISO('2026-03-25')!)).toBe('2026-03-25')
		expect(plainDateFromISO('2026-02-31')).toBeNull()
		expect(plainDateFromISO('nope')).toBeNull()
	})
	it('adds days/months across boundaries', () => {
		expect(plainDateToISO(plainDateAddDays(plainDateFromISO('2026-01-31')!, 1))).toBe('2026-02-01')
		expect(plainDateToISO(plainDateAddMonths(plainDateFromISO('2026-01-31')!, 1))).toBe('2026-02-28')
	})
	it('reports ISO week numbers', () => {
		expect(plainDateGetWeekNumber(plainDateFromISO('2026-01-01')!)).toBe(1)
		expect(plainDateGetWeekNumber(plainDateFromISO('2025-12-29')!)).toBe(1)
	})
})

describe('time values', () => {
	it('parses loose input', () => {
		expect(parseTimeInput('2:30 PM')).toBe('14:30')
		expect(parseTimeInput('1430')).toBe('14:30')
		expect(parseTimeInput('14:30:05', true)).toBe('14:30:05')
		expect(parseTimeInput('25:00')).toBeNull()
	})
	it('steps times and clamps to the minute', () => {
		expect(adjustTime('23:55', 10)).toBe('00:05')
		expect(adjustTime('00:05', -10)).toBe('23:55')
	})
	it('checks ranges', () => {
		expect(isTimeInRange('12:00', '09:00', '17:00')).toBe(true)
		expect(isTimeInRange('20:00', '09:00', '17:00')).toBe(false)
	})
	it('splits and combines datetimes', () => {
		expect(splitDateTime('2026-03-25T14:30')).toEqual({ date: '2026-03-25', time: '14:30' })
		expect(combineDateTime('2026-03-25', '14:30')).toBe('2026-03-25T14:30')
	})
})

describe('presentation resolution', () => {
	it('maps deprecated nativePicker onto presentation', () => {
		expect(effectivePresentation(undefined, 'touch', 'date')).toBe('adaptive-native')
		expect(effectivePresentation(undefined, 'always', 'date')).toBe('native')
		expect(effectivePresentation(undefined, 'never', 'date')).toBe('adaptive-bottom-sheet')
		expect(effectivePresentation('popover', 'always', 'date')).toBe('popover')
	})
})

describe('calendar month grid', () => {
	it('fills leading/trailing days and constant row count', () => {
		const grid = buildMonthGrid(2026, 10, 0, false, 'en-US')
		expect(grid.weeks).toHaveLength(6)
		expect(grid.weeks[0][0].iso).toBe('2026-09-27')
		expect(grid.dayNames).toHaveLength(7)
	})
	it('trims rows with hasVariableRowCount', () => {
		const grid = buildMonthGrid(2026, 2, 0, true, 'en-US')
		expect(grid.weeks.length).toBeLessThanOrEqual(6)
	})
})

describe('range picking', () => {
	it('anchors then commits in order', () => {
		expect(applyRangePick('2026-03-20', '2026-03-10')).toEqual({ kind: 'commit', range: { start: '2026-03-10', end: '2026-03-20' } })
	})
	it('re-clicking the anchor commits a one-day range or cancels', () => {
		expect(applyRangePick('2026-03-10', '2026-03-10')).toEqual({ kind: 'commit', range: { start: '2026-03-10', end: '2026-03-10' } })
		expect(applyRangePick('2026-03-10', '2026-03-10', 2)).toEqual({ kind: 'cancel' })
	})
})

describe('date constraints', () => {
	it('applies min/max and callback constraints', () => {
		const check = createDateDisabledCheck({ min: '2026-03-10', max: '2026-03-20' })
		expect(check(plainDateFromISO('2026-03-05')!)).toBe(true)
		expect(check(plainDateFromISO('2026-03-15')!)).toBe(false)
		const weekend = createDateDisabledCheck({ dateConstraints: [(d: Date) => d.getDay() !== 0 && d.getDay() !== 6] })
		expect(weekend(plainDateFromISO('2026-10-03')!)).toBe(true) // Saturday
		expect(weekend(plainDateFromISO('2026-10-05')!)).toBe(false)
	})
})

describe('date display formats', () => {
	it('formats named formats', () => {
		expect(formatDateValue('2026-03-25', 'date', 'en-US')).toContain('Mar')
		expect(formatDateValue('2026-03-25', 'date_long', 'en-US')).toContain('25')
	})
	it('formats 12h/24h time', () => {
		expect(formatDisplayTime12h('14:30')).toBe('2:30 PM')
		expect(formatDisplayTime12h('00:05')).toBe('12:05 AM')
	})
})
