/**
 * Calendar hooks — the stateful ports of the pure calendar-core engine,
 * exported for callers building their own calendar surfaces (Astryx parity:
 * `useCalendarDays`, `useCalendarConstraints`, `useCalendarNavigation`).
 *
 * This module carries hooks, so it lives in `.tsrx` (the renderer's include
 * glob) even though it emits no JSX — hook calls need slot compilation.
 */

import { useMemo, useState } from 'octane'
import type { DateRange, ISODateString } from './props'
import {
	plainDateAddMonths,
	plainDateFromISO,
	plainDateToISO,
	type PlainDate,
} from './datetime'

import {
	buildMonthGrid,
	createDateDisabledCheck,
	getInitialFocusDate,
	monthStart,
	navigationBounds,
	type CalendarConstraintsInput,
	type CalendarMonthGrid,
} from './calendar-core'

export interface UseCalendarConstraintsOptions extends CalendarConstraintsInput {}

export interface UseCalendarConstraintsReturn {
	isDateDisabled: (date: PlainDate) => boolean
}

export function useCalendarConstraints(options: UseCalendarConstraintsOptions): UseCalendarConstraintsReturn {
	const isDateDisabled = useMemo(
		() => createDateDisabledCheck(options),
		[options.min, options.max, options.dateConstraints, options.maxRangeSpan, options.minRangeSpan, options.rangeAnchor],
	)

	return { isDateDisabled }
}

export interface UseCalendarDaysOptions {
	year: number
	month: number
	weekStartsOn?: import('./props').DayOfWeek | import('./props').DayOfWeekName
	hasVariableRowCount?: boolean
	locale?: string
}

export type UseCalendarDaysReturn = CalendarMonthGrid

export function useCalendarDays(options: UseCalendarDaysOptions): CalendarMonthGrid {
	return useMemo(
		() => buildMonthGrid(options.year, options.month, options.weekStartsOn, options.hasVariableRowCount, options.locale),
		[options.year, options.month, options.weekStartsOn, options.hasVariableRowCount, options.locale],
	)
}

export interface UseCalendarNavigationOptions {
	numberOfMonths?: 1 | 2
	min?: ISODateString
	max?: ISODateString
	focusDate?: ISODateString
	onFocusDateChange?: (focusDate: ISODateString) => void
	/** Seeds the uncontrolled view when `focusDate` is absent — selected
	 *  value or today, clamped into [min, max]. */
	value?: ISODateString | DateRange
}

export interface UseCalendarNavigationReturn {
	/** First-of-month basis for the leading pane. */
	baseMonth: PlainDate
	canNavigatePrevious: boolean
	canNavigateNext: boolean
	navigateMonths(delta: number): void
	navigateTo(date: ISODateString): void
}

export function useCalendarNavigation(options: UseCalendarNavigationOptions): UseCalendarNavigationReturn {
	const numberOfMonths = options.numberOfMonths ?? 1
	const controlled = options.focusDate !== undefined
	const [internalBase, setInternalBase] = useState<PlainDate>(() =>
		monthStart(getInitialFocusDate({
			focusDate: options.focusDate,
			value: options.value,
			min: options.min,
			max: options.max,
			numberOfMonths,
		})),
	)

	const controlledPd = controlled ? plainDateFromISO(options.focusDate!) : null
	const baseMonth = controlledPd ? monthStart(controlledPd) : internalBase

	const commit = (next: PlainDate) => {
		const iso = plainDateToISO(next)
		if (!controlled) setInternalBase(next)
		options.onFocusDateChange?.(iso)
	}

	const bounds = navigationBounds(baseMonth, numberOfMonths, options.min, options.max)

	return {
		baseMonth,
		canNavigatePrevious: bounds.canNavigatePrevious,
		canNavigateNext: bounds.canNavigateNext,
		navigateMonths(delta: number) {
			if (delta < 0 && !bounds.canNavigatePrevious) return
			if (delta > 0 && !bounds.canNavigateNext) return
			commit(monthStart(plainDateAddMonths(baseMonth, delta)))
		},
		navigateTo(date: ISODateString) {
			const pd = plainDateFromISO(date)
			if (pd) commit(monthStart(pd))
		},
	}
}
