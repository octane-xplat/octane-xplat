/**
 * Pure calendar engine shared by every Calendar leaf — month grids, selection
 * state, constraint evaluation, range-pick reduction, and navigation bounds.
 * No hooks, no DOM, no platform imports.
 */

import {
	plainDateAddDays,
	plainDateAddMonths,
	plainDateCompare,
	plainDateCreate,
	plainDateDiffDays,
	plainDateFromISO,
	plainDateGetWeekNumber,
	plainDateIsAfter,
	plainDateIsBefore,
	plainDateIsEqual,
	plainDateToDate,
	plainDateToISO,
	plainDateToday,
	daysInMonth,
	formatMonthYear,
	getStandaloneShortWeekdayNames,
	normalizeDayOfWeek,
	resolveLocale,
	type PlainDate,
} from './datetime'
import type { DateRange, DayOfWeek, DayOfWeekName, ISODateString } from './props'

export { isSameDay, isDateInRange, getWeekNumber }

function isSameDay(a: ISODateString, b: ISODateString): boolean {
	return a === b
}

function isDateInRange(iso: ISODateString, range: DateRange): boolean {
	return iso >= range.start && iso <= range.end
}

function getWeekNumber(iso: ISODateString): number {
	const pd = plainDateFromISO(iso)
	return pd ? plainDateGetWeekNumber(pd) : 0
}

// ---------------------------------------------------------------------------
// Month grid
// ---------------------------------------------------------------------------

export interface CalendarDay {
	readonly date: PlainDate
	readonly iso: ISODateString
	readonly dayOfMonth: number
	readonly isToday: boolean
	readonly isOutsideMonth: boolean
	readonly isWeekend: boolean
	readonly isSunday: boolean
	readonly isMonday: boolean
	readonly isFirstWeekOfMonth: boolean
	readonly isLastWeekOfMonth: boolean
}

export interface CalendarMonthGrid {
	readonly year: number
	readonly month: number
	readonly weeks: CalendarDay[][]
	/** Short standalone weekday labels, ordered from `weekStartsOn`. */
	readonly dayNames: string[]
}

/**
 * Build the week grid for a month. Outside-month days pad the first/last
 * week so every row has 7 cells; fixed grids (`hasVariableRowCount` false,
 * the default) always emit 6 weeks so the calendar height never shifts
 * between months.
 */
export function buildMonthGrid(
	year: number,
	month: number,
	weekStartsOn: DayOfWeek | DayOfWeekName | undefined,
	hasVariableRowCount = false,
	locale?: string,
): CalendarMonthGrid {
	const start = normalizeDayOfWeek(weekStartsOn)
	const loc = locale ?? resolveLocale()
	const names = getStandaloneShortWeekdayNames(loc)
	const dayNames = Array.from({ length: 7 }, (_, i) => names[(start + i) % 7])

	const first = plainDateCreate(year, month, 1)!
	const firstDow = plainDateToDate(first).getDay()
	const lead = (firstDow - start + 7) % 7

	const gridStart = plainDateAddDays(first, -lead)
	const monthDays = daysInMonth(year, month)
	const last = plainDateCreate(year, month, monthDays)!
	const lastDow = plainDateToDate(last).getDay()
	const trail = (start + 6 - lastDow + 7) % 7

	const totalDays = hasVariableRowCount ? lead + monthDays + trail : 42
	const weekCount = Math.ceil(totalDays / 7)
	const today = plainDateToday()

	const weeks: CalendarDay[][] = []
	for (let w = 0; w < weekCount; w++) {
		const week: CalendarDay[] = []
		for (let d = 0; d < 7; d++) {
			const date = plainDateAddDays(gridStart, w * 7 + d)
			const dow = plainDateToDate(date).getDay()
			week.push({
				date,
				iso: plainDateToISO(date),
				dayOfMonth: date.day,
				isToday: plainDateIsEqual(date, today),
				isOutsideMonth: date.month !== month || date.year !== year,
				isWeekend: dow === 0 || dow === 6,
				isSunday: dow === 0,
				isMonday: dow === 1,
				isFirstWeekOfMonth: date.day <= 7 && !plainDateIsBefore(date, first),
				isLastWeekOfMonth: date.day > monthDays - 7 && !plainDateIsAfter(date, last),
			})
		}
		weeks.push(week)
	}

	return { year, month, weeks, dayNames }
}

export function monthLabel(year: number, month: number, locale?: string): string {
	return formatMonthYear(year, month, locale)
}

// ---------------------------------------------------------------------------
// Constraints — a day is disabled when outside [min, max], when any
// dateConstraints callback returns false, or (range mode, once an anchor is
// picked) when the resulting span would violate min/maxRangeSpan.
// ---------------------------------------------------------------------------

export interface CalendarConstraintsInput {
	min?: ISODateString
	max?: ISODateString
	dateConstraints?: ReadonlyArray<(date: Date) => boolean>
	maxRangeSpan?: number
	minRangeSpan?: number
	/** In-progress range anchor (range mode). */
	rangeAnchor?: ISODateString | null
}

export function createDateDisabledCheck(input: CalendarConstraintsInput): (date: PlainDate) => boolean {
	const minPd = input.min ? plainDateFromISO(input.min) : null
	const maxPd = input.max ? plainDateFromISO(input.max) : null
	const anchorPd = input.rangeAnchor ? plainDateFromISO(input.rangeAnchor) : null

	return (date: PlainDate): boolean => {
		if (minPd && plainDateIsBefore(date, minPd)) return true
		if (maxPd && plainDateIsAfter(date, maxPd)) return true
		if (input.dateConstraints) {
			for (const constraint of input.dateConstraints) {
				if (!constraint(plainDateToDate(date))) return true
			}
		}
		if (anchorPd) {
			const span = Math.abs(plainDateDiffDays(date, anchorPd)) + 1
			if (input.maxRangeSpan != null && span > input.maxRangeSpan) return true
			// The anchor itself stays selectable below the minimum — clicking it
			// again is the "move the start" escape hatch (commit-or-cancel is
			// decided by the picker, not the constraint).
			if (input.minRangeSpan != null && span < input.minRangeSpan && !plainDateIsEqual(date, anchorPd)) {
				return true
			}
		}
		return false
	}
}

/** Validate a complete range at every commit boundary, including presets.
 * Bounds/predicates apply to endpoints; interior days are not constrained. */
export function isDateRangeAllowed(range: DateRange, input: CalendarConstraintsInput): boolean {
	const start = plainDateFromISO(range.start)
	const end = plainDateFromISO(range.end)
	if (!start || !end || plainDateIsAfter(start, end)) {
		return false
	}

	const span = plainDateDiffDays(end, start) + 1
	if (span < (input.minRangeSpan ?? 1)) {
		return false
	}

	if (input.maxRangeSpan != null && span > input.maxRangeSpan) {
		return false
	}

	const isDisabled = createDateDisabledCheck({ ...input, rangeAnchor: null })
	return !isDisabled(start) && !isDisabled(end)
}

// ---------------------------------------------------------------------------
// Range picking
// ---------------------------------------------------------------------------

export type RangePickResult =
	| { kind: 'start'; anchor: ISODateString }
	| { kind: 'commit'; range: DateRange }
	| { kind: 'cancel' }

/** Second-pick reducer: earlier pick → ordered commit; same-day pick →
 *  single-day range when minSpan allows, else cancel the in-progress
 *  selection. */
export function applyRangePick(anchor: ISODateString, iso: ISODateString, minRangeSpan?: number): RangePickResult {
	const day = plainDateFromISO(iso)
	const anchorPd = plainDateFromISO(anchor)
	if (!day || !anchorPd) return { kind: 'cancel' }
	if (plainDateIsEqual(day, anchorPd)) {
		if ((minRangeSpan ?? 1) > 1) return { kind: 'cancel' }
		return { kind: 'commit', range: { start: iso, end: iso } }
	}
	const ordered = plainDateIsBefore(day, anchorPd)
		? { start: iso, end: anchor }
		: { start: anchor, end: iso }
	return { kind: 'commit', range: ordered }
}

// ---------------------------------------------------------------------------
// Initial focus + navigation bounds
// ---------------------------------------------------------------------------

/** First-of-month basis for everything that navigates. */
export function monthStart(pd: PlainDate): PlainDate {
	return { year: pd.year, month: pd.month, day: 1 }
}

/** Initial focus precedence: explicit focusDate → selected value → today,
 *  clamped into [min, max] so an all-disabled window still opens on its
 *  nearest bound. With two months the base month shifts so `max` isn't
 *  stranded in an out-of-range trailing pane. */
export function getInitialFocusDate(input: {
	focusDate?: ISODateString
	value?: ISODateString | DateRange
	min?: ISODateString
	max?: ISODateString
	numberOfMonths?: 1 | 2
}): PlainDate {
	const explicit = input.focusDate ? plainDateFromISO(input.focusDate) : null
	const selectedRaw = typeof input.value === 'string'
		? input.value
		: input.value?.start
	const selected = selectedRaw ? plainDateFromISO(selectedRaw) : null

	const minPd = input.min ? plainDateFromISO(input.min) : null
	const maxPd = input.max ? plainDateFromISO(input.max) : null

	let base = explicit ?? selected ?? plainDateToday()
	if (minPd && plainDateIsBefore(base, minPd)) base = minPd
	if (maxPd && plainDateIsAfter(base, maxPd)) base = maxPd

	// A two-month view shows [baseMonth, baseMonth+1]; pull the base back a
	// month when every day of the leading month would be out of range.
	if ((input.numberOfMonths ?? 1) > 1) {
		const leadingMonthEnd = plainDateCreate(base.year, base.month, daysInMonth(base.year, base.month))!
		if (minPd && plainDateIsBefore(leadingMonthEnd, minPd)) {
			base = plainDateAddMonths(monthStart(base), 1)
			if (base.day > daysInMonth(base.year, base.month)) base = { ...base, day: daysInMonth(base.year, base.month) }
		}
		if (maxPd) {
			const trailingStart = monthStart(plainDateAddMonths(monthStart(base), 1))
			if (plainDateIsAfter(trailingStart, maxPd)) {
				base = monthStart(plainDateAddMonths(monthStart(base), -1))
			}
		}
	}
	return base
}

export interface NavigationBounds {
	canNavigatePrevious: boolean
	canNavigateNext: boolean
}

export function navigationBounds(
	baseMonth: PlainDate,
	numberOfMonths: number,
	min?: ISODateString,
	max?: ISODateString,
): NavigationBounds {
	const minPd = min ? plainDateFromISO(min) : null
	const maxPd = max ? plainDateFromISO(max) : null
	const prevMonth = plainDateAddMonths(baseMonth, -1)
	const prevEnd = plainDateCreate(prevMonth.year, prevMonth.month, daysInMonth(prevMonth.year, prevMonth.month))!
	const nextStart = plainDateAddMonths(baseMonth, numberOfMonths)
	return {
		canNavigatePrevious: !(minPd && plainDateIsBefore(prevEnd, minPd)),
		canNavigateNext: !(maxPd && plainDateIsAfter(nextStart, maxPd)),
	}
}

// ---------------------------------------------------------------------------
// Day-cell state — which visual/interactive flags a day gets. Outside-month
// days are never interactive and never carry selection/range styling (they'd
// duplicate the styling of the real day in the adjacent pane).
// ---------------------------------------------------------------------------

export interface DayCellState {
	isSelected: boolean
	isRangeStart: boolean
	isRangeEnd: boolean
	isInRange: boolean
	/** Anchored but uncommitted first pick in range mode. */
	isPendingStart: boolean
	isDisabled: boolean
}

export function computeDayCellState(
	day: CalendarDay,
	opts: {
		mode: 'single' | 'range'
		value?: ISODateString | DateRange
		rangeAnchor?: ISODateString | null
		isDateDisabled: (date: PlainDate) => boolean
	},
): DayCellState {
	const disabled = opts.isDateDisabled(day.date)
	if (day.isOutsideMonth) {
		return { isSelected: false, isRangeStart: false, isRangeEnd: false, isInRange: false, isPendingStart: false, isDisabled: true }
	}
	const iso = day.iso
	if (opts.mode === 'single') {
		const value = typeof opts.value === 'string' ? opts.value : undefined
		return { isSelected: value === iso, isRangeStart: false, isRangeEnd: false, isInRange: false, isPendingStart: false, isDisabled: disabled }
	}
	const range = typeof opts.value === 'object' && opts.value ? opts.value : undefined
	const anchor = opts.rangeAnchor ?? null
	const isRangeStart = range ? range.start === iso : anchor === iso
	const isRangeEnd = range ? range.end === iso : false
	const inCommittedRange = !!range && iso > range.start && iso < range.end
	const inPendingRange = !!anchor && iso > anchor && !disabled
	return {
		isSelected: false,
		isRangeStart,
		isRangeEnd,
		isInRange: inCommittedRange || inPendingRange,
		isPendingStart: !range && anchor === iso,
		isDisabled: disabled,
	}
}

// ---------------------------------------------------------------------------
// Range continuity styling — which edges of a selected/in-range cell touch a
// selected neighbor, used for rounded-cap classes on web.
// ---------------------------------------------------------------------------

export interface CellContinuity {
	/** The previous day cell exists in the pane and continues the range band. */
	before: boolean
	/** The next day cell exists in the pane and continues the range band. */
	after: boolean
}

/** Whether an in-pane day carries the range band — committed span plus the
 *  pending anchor. Outside-month pads never carry it (they would duplicate
 *  the real day's styling in the adjacent pane). */
export function dayCarriesBand(
	state: Pick<DayCellState, 'isInRange' | 'isRangeStart' | 'isRangeEnd'>,
): boolean {
	return state.isInRange || state.isRangeStart || state.isRangeEnd
}

export type CellRounding = 'none' | 'start' | 'end' | 'both'

/** Which corners get the selected-range radius: band edges round, band
 *  interiors don't. */
export function computeCellRounding(
	state: DayCellState,
	continuity: CellContinuity,
): CellRounding {
	if (!dayCarriesBand(state)) return 'none'
	const left = !continuity.before
	const right = !continuity.after
	if (left && right) return 'both'
	if (left) return 'start'
	if (right) return 'end'
	return 'none'
}
