import { describe, expect, it } from 'vitest'
import { buildMonthGrid, createDateDisabledCheck } from './calendar-core'
import { calendarKeyTarget, isDateComposing, timeOptionIndex } from './date-keyboard'
import {
	formatDateValue,
	formatLocalizedTime,
	parseDateInput,
	plainDateToISO,
	resolveLocale,
} from './datetime'

const months = [buildMonthGrid(2026, 3, 1)]
const move = (iso: string, key: string, extra = {}) =>
	calendarKeyTarget({ iso, event: { key }, months, isDisabled: () => false, ...extra })

describe('portable calendar keys', () => {
	it('preserves columns when skipping disabled weeks and bounds searches', () => {
		const isDisabled = createDateDisabledCheck({
			dateConstraints: [(date) => ![12, 19].includes(date.getDate())],
		})

		expect(move('2026-03-05', 'ArrowDown', { isDisabled })).toBe('2026-03-26')
		expect(move('2026-03-26', 'ArrowUp', { isDisabled })).toBe('2026-03-05')
		expect(move('2026-03-05', 'ArrowDown', { isDisabled, max: '2026-03-20' })).toBeNull()
		expect(move('2026-03-05', 'ArrowRight', { isDisabled: () => true })).toBeNull()
	})

	it('finds row edges and grid edges without selecting outside pad cells', () => {
		expect(move('2026-03-18', 'Home')).toBe('2026-03-16')
		expect(move('2026-03-18', 'End')).toBe('2026-03-22')
		expect(move('2026-03-01', 'Home')).toBe('2026-03-01')
		expect(move('2026-03-18', 'Home', { event: { key: 'Home', ctrlKey: true } })).toBe('2026-03-01')
		expect(move('2026-03-18', 'End', { event: { key: 'End', metaKey: true } })).toBe('2026-03-31')
	})

	it('reverses only horizontal keys in RTL', () => {
		expect(move('2026-03-18', 'ArrowLeft', { rtl: true })).toBe('2026-03-19')
		expect(move('2026-03-18', 'ArrowRight', { rtl: true })).toBe('2026-03-17')
		expect(move('2026-03-18', 'ArrowUp', { rtl: true })).toBe('2026-03-11')
	})

	it('pages with clamped dates and skips disabled targets inside the destination month', () => {
		expect(move('2026-03-31', 'PageUp')).toBe('2026-02-28')
		expect(
			move('2026-03-15', 'PageDown', { isDisabled: (date: { day: number }) => date.day === 15 }),
		).toBe('2026-04-16')

		expect(move('2026-03-15', 'PageUp', { min: '2026-03-01' })).toBeNull()
		expect(move('2026-04-15', 'PageUp', { min: '2026-03-20' })).toBe('2026-03-20')
		expect(move('2026-02-15', 'PageDown', { max: '2026-03-10' })).toBe('2026-03-10')
		expect(move('garbage', 'ArrowDown')).toBeNull()
	})

	it('ignores composing and already handled events', () => {
		for (const event of [
			{ key: 'ArrowDown', isComposing: true },
			{ key: 'Home', keyCode: 229 },
			{ key: 'End', defaultPrevented: true },
		]) {
			expect(move('2026-03-15', event.key, { event })).toBeNull()
		}
	})
})

it('clamps time options and keeps empty lists inactive', () => {
	expect(timeOptionIndex('ArrowDown', -1, 3)).toBe(0)
	expect(timeOptionIndex('ArrowUp', 0, 3)).toBe(0)
	expect(timeOptionIndex('End', 0, 3)).toBe(2)
	expect(timeOptionIndex('ArrowDown', 2, 3)).toBe(2)
	expect(timeOptionIndex('Home', 2, 0)).toBe(-1)
})

it('uses explicit locale consistently and falls back from invalid tags', () => {
	expect(plainDateToISO(parseDateInput('04/05/2026', 'fr-FR')!)).toBe('2026-05-04')
	expect(plainDateToISO(parseDateInput('04/05/2026', 'en-US')!)).toBe('2026-04-05')
	expect(formatDateValue('2026-03-05', 'date_long', 'fr-FR')).toContain('mars')
	expect(formatLocalizedTime('14:30', false, '24h', 'fr-FR')).toBe('14:30')
	expect(formatLocalizedTime('14:30', false, '12h', 'ar-EG')).toContain('٢')
	expect(resolveLocale('invalid_locale')).toBe(resolveLocale())
})

it('detects IME key flags', () => {
	expect(isDateComposing({ keyCode: 229 })).toBe(true)
	expect(isDateComposing({ isComposing: true })).toBe(true)
	expect(isDateComposing({})).toBe(false)
})
