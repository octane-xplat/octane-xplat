/**
 * Calendar hooks — the stateful ports of the pure calendar-core engine,
 * exported for callers building their own calendar surfaces (Astryx parity:
 * `useCalendarDays`, `useCalendarConstraints`, `useCalendarNavigation`).
 *
 * This module carries hooks, so it lives in `.tsrx` (the renderer's include
 * glob) even though it emits no JSX — hook calls need slot compilation.
 */

import { useMemo, useState } from 'octane'
import type { DateRange, ISODateString } from '../../props'
import { plainDateAddMonths, plainDateFromISO, plainDateToISO, type PlainDate } from './datetime'

import {
	buildMonthGrid,
	createDateDisabledCheck,
	getInitialFocusDate,
	monthStart,
	navigationBounds,
	type CalendarConstraintsInput,
	type CalendarMonthGrid,
} from './calendar-core'

/**
 * Options for `useCalendarConstraints` — `min`/`max` ISO dates bounding selection.
 */
/** Options for `useCalendarConstraints` — the same bounds Calendar accepts. */
export interface UseCalendarConstraintsOptions extends CalendarConstraintsInput {}

/**
 * `useCalendarConstraints` result — clamp/is-disabled helpers applied to day cells.
 */
export interface UseCalendarConstraintsReturn {
	/** Compiled predicate — true when a date is blocked by min/max/dateConstraints. */
	isDateDisabled: (date: PlainDate) => boolean
}

/**
 * Selectable-range constraints for `Calendar` — clamps/blocks dates outside `min`/`max`.
 *
 * @see UseCalendarConstraintsOptions.
 */
/** Compiles Calendar's bounds into a cached disabled predicate. */
export function useCalendarConstraints(
	options: UseCalendarConstraintsOptions,
): UseCalendarConstraintsReturn {
	const isDateDisabled = useMemo(
		() => createDateDisabledCheck(options),
		[
			options.min,
			options.max,
			options.dateConstraints,
			options.maxRangeSpan,
			options.minRangeSpan,
			options.rangeAnchor,
		],
	)

	return { isDateDisabled }
}

/**
 * Options for `useCalendarDays` — visible month plus constraint inputs.
 */
export interface UseCalendarDaysOptions {
	/** Calendar year of the month to build. */
	year: number
	/** 0-based month index. */
	month: number
	/** First column's weekday; defaults to locale Sunday. */
	weekStartsOn?: import('../../props').DayOfWeek | import('../../props').DayOfWeekName
	/** Emit 4–6 rows instead of a fixed 6-row grid — the height shifts between months. */
	hasVariableRowCount?: boolean
	/** BCP-47 locale for weekday names and week calculations. */
	locale?: string
}

/**
 * `useCalendarDays` result — the computed `CalendarMonthGrid`.
 */
/** The computed month grid — alias kept for hook-result naming. */
export type UseCalendarDaysReturn = CalendarMonthGrid

/**
 * Month-grid day cells for `Calendar` — `useCalendarDays` computes the visible `CalendarMonthGrid`.
 *
 * @see UseCalendarDaysOptions, UseCalendarDaysReturn, CalendarDay.
 */
/** Memoized month grid for `Calendar`. */
export function useCalendarDays(options: UseCalendarDaysOptions): CalendarMonthGrid {
	return useMemo(
		() =>
			buildMonthGrid(
				options.year,
				options.month,
				options.weekStartsOn,
				options.hasVariableRowCount,
				options.locale,
			),
		[
			options.year,
			options.month,
			options.weekStartsOn,
			options.hasVariableRowCount,
			options.locale,
		],
	)
}

/**
 * Options for `useCalendarNavigation` — current month plus constraint bounds.
 */
export interface UseCalendarNavigationOptions {
	/** Visible months — paging moves by this many. */
	numberOfMonths?: 1 | 2
	/** Earliest month the user may reach. */
	min?: ISODateString
	/** Latest month the user may reach. */
	max?: ISODateString
	/** Controlled focused/visible month anchor. */
	focusDate?: ISODateString
	/** Reports anchor changes — the controlled pair for `focusDate`. */
	onFocusDateChange?: (focusDate: ISODateString) => void
	/** Seeds the uncontrolled view when `focusDate` is absent — selected
	 *  value or today, clamped into [min, max]. */
	/** Current selection — used to pick the initial anchor when `focusDate` is unset. */
	value?: ISODateString | DateRange
}

/**
 * `useCalendarNavigation` result — `prevMonth`/`nextMonth`/current-month state.
 */
export interface UseCalendarNavigationReturn {
	/** First-of-month basis for the leading pane. */
	baseMonth: PlainDate
	/** Whether paging backward stays within `min`. */
	canNavigatePrevious: boolean
	/** Whether paging forward stays within `max`. */
	canNavigateNext: boolean
	/** Pages by `delta` months (negative goes back), clamped to bounds. */
	navigateMonths(delta: number): void
	/** Jumps the anchor to `date`'s month, clamped to bounds. */
	navigateTo(date: ISODateString): void
}

/**
 * Month navigation for `Calendar` — prev/next plus range clamping.
 *
 * @see UseCalendarNavigationOptions.
 */
/** Visible-month anchor plus bounded paging for `Calendar`. */
export function useCalendarNavigation(
	options: UseCalendarNavigationOptions,
): UseCalendarNavigationReturn {
	const numberOfMonths = options.numberOfMonths ?? 1
	const controlled = options.focusDate !== undefined
	const [internalBase, setInternalBase] = useState<PlainDate>(() =>
		monthStart(
			getInitialFocusDate({
				focusDate: options.focusDate,
				value: options.value,
				min: options.min,
				max: options.max,
				numberOfMonths,
			}),
		),
	)

	const controlledPd = controlled ? plainDateFromISO(options.focusDate!) : null
	const baseMonth = controlledPd ? monthStart(controlledPd) : internalBase

	const commit = (next: PlainDate) => {
		const iso = plainDateToISO(next)
		if (!controlled) {
			setInternalBase(next)
		}

		options.onFocusDateChange?.(iso)
	}

	const bounds = navigationBounds(baseMonth, numberOfMonths, options.min, options.max)

	return {
		baseMonth,
		canNavigatePrevious: bounds.canNavigatePrevious,
		canNavigateNext: bounds.canNavigateNext,
		navigateMonths(delta: number) {
			if (delta < 0 && !bounds.canNavigatePrevious) {
				return
			}

			if (delta > 0 && !bounds.canNavigateNext) {
				return
			}

			commit(monthStart(plainDateAddMonths(baseMonth, delta)))
		},
		navigateTo(date: ISODateString) {
			const pd = plainDateFromISO(date)
			if (pd) {
				commit(monthStart(pd))
			}
		},
	}
}
