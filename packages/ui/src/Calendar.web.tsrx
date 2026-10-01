import { useEffect, useMemo, useRef, useState } from 'octane'
import type { CalendarProps, DateRange, ISODateString } from './props'
import { cx } from './cx'
import { Icon } from './Icon.web.tsrx'
import {
	DATE_FORMAT_WITH_WEEKDAY,
	normalizeDayOfWeek,
	plainDateAddDays,
	plainDateAddMonths,
	plainDateFormat,
	plainDateFromISO,
	plainDateGetWeekNumber,
	plainDateIsBefore,
	plainDateToDate,
	plainDateToISO,
	resolveLocale,
} from './datetime'

import {
	applyRangePick,
	buildMonthGrid,
	computeCellRounding,
	computeDayCellState,
	createDateDisabledCheck,
	dayCarriesBand,
	getInitialFocusDate,
	monthLabel,
	monthStart,
	navigationBounds,
	type CalendarMonthGrid,
} from './calendar-core'

const EMPTY_VALUE: ISODateString | DateRange | undefined = undefined

/** Self-drawn month calendar — `single` or `range` selection, ISO values.
 *  Keyboard: arrows move the day (crossing months pages the grid), PageUp/
 *  PageDown move a month, Home/End move to the row edges, Enter/Space picks,
 *  Escape cancels an in-progress range. `bind` exposes `{navigateTo}`. */
export function Calendar(props: CalendarProps) @{
	const mode = props.mode ?? 'single'
	const numberOfMonths = props.numberOfMonths === 2 ? 2 : 1
	const weekStartsOn = normalizeDayOfWeek(props.weekStartsOn)
	const locale = resolveLocale()

	const controlled = props.value !== undefined
	const [internalValue, setInternalValue] = useState<ISODateString | DateRange | undefined>(props.defaultValue as ISODateString | DateRange | undefined)
	const currentValue: ISODateString | DateRange | undefined = controlled ? props.value : internalValue

	const [rangeAnchor, setRangeAnchor] = useState<ISODateString | null>(null)
	const [hoveredIso, setHoveredIso] = useState<ISODateString | null>(null)
	const [announcement, setAnnouncement] = useState('')
	const [focusIso, setFocusIso] = useState<ISODateString | null>(null)
	const [pendingFocus, setPendingFocus] = useState<ISODateString | null>(null)

	const focusControlled = props.focusDate !== undefined
	const [internalBase, setInternalBase] = useState(() =>
		monthStart(getInitialFocusDate({
			focusDate: props.focusDate,
			value: currentValue,
			min: props.min,
			max: props.max,
			numberOfMonths,
		})))

	const baseMonth = focusControlled
		? monthStart(plainDateFromISO(props.focusDate!) ?? internalBase)
		: internalBase

	const setBaseMonth = (next: ReturnType<typeof monthStart>, opts?: { focusIso?: ISODateString }) => {
		if (opts?.focusIso) setPendingFocus(opts.focusIso)
		if (!focusControlled) setInternalBase(next)
		props.onFocusDateChange?.(plainDateToISO(next))
	}

	const months = useMemo(
		() => Array.from({ length: numberOfMonths }, (_, i) => buildMonthGrid(
			plainDateAddMonths(baseMonth, i).year,
			plainDateAddMonths(baseMonth, i).month,
			weekStartsOn,
			props.hasVariableRowCount ?? false,
			locale,
		)),
		[baseMonth, numberOfMonths, weekStartsOn, props.hasVariableRowCount, locale],
	)

	const isDateDisabled = useMemo(
		() => createDateDisabledCheck({
			min: props.min,
			max: props.max,
			dateConstraints: props.dateConstraints,
			maxRangeSpan: props.maxRangeSpan,
			minRangeSpan: props.minRangeSpan,
			rangeAnchor: mode === 'range' ? rangeAnchor : null,
		}),
		[props.min, props.max, props.dateConstraints, props.maxRangeSpan, props.minRangeSpan, rangeAnchor, mode],
	)

	const bounds = navigationBounds(baseMonth, numberOfMonths, props.min, props.max)
	const monthYearLabel = months.map((m) => monthLabel(m.year, m.month, locale)).join(' – ')

	// Announce the visible month when navigation changes it (not on mount).
	const firstLabel = useRef(true)
	useEffect(() => {
		if (firstLabel.current) { firstLabel.current = false; return }
		setAnnouncement(monthYearLabel)
	}, [monthYearLabel])

	// Apply pending focus after a month page — the target cell lives in the
	// newly rendered grid.
	const root = useRef<HTMLDivElement | null>(null)
	useEffect(() => {
		if (!pendingFocus || !root.current) return
		const el = root.current.querySelector(`[data-date="${pendingFocus}"]`) as HTMLElement | null
		el?.focus?.()
		setFocusIso(pendingFocus)
		setPendingFocus(null)
	}, [pendingFocus, months])

	// bind → {navigateTo}
	const navApi = useRef({ navigateTo: (_: ISODateString) => {} })
	navApi.current = {
		navigateTo: (iso: ISODateString) => {
			const pd = plainDateFromISO(iso)
			if (pd) setBaseMonth(monthStart(pd))
		},
	}

	useEffect(() => {
		props.bind?.({ navigateTo: (iso: ISODateString) => navApi.current.navigateTo(iso) })
	}, [])

	const pick = (iso: ISODateString) => {
		const pd = plainDateFromISO(iso)
		if (!pd || isDateDisabled(pd)) return
		if (mode === 'single') {
			if (!controlled) setInternalValue(iso)

			;(props.onChange as ((value: ISODateString, date: Date) => void) | undefined)?.(iso, plainDateToDate(pd))
			return
		}

		if (rangeAnchor === null) {
			setRangeAnchor(iso)
			setAnnouncement(`Range start: ${plainDateFormat(pd, DATE_FORMAT_WITH_WEEKDAY, locale)}`)
			return
		}

		const result = applyRangePick(rangeAnchor, iso, props.minRangeSpan)
		if (result.kind === 'cancel') {
			setRangeAnchor(null)
			setAnnouncement(`Range cleared: ${plainDateFormat(pd, DATE_FORMAT_WITH_WEEKDAY, locale)}`)
			return
		}

		if (result.kind === 'commit') {
			setRangeAnchor(null)
			if (!controlled) setInternalValue(result.range)

			;(props.onChange as ((value: DateRange) => void) | undefined)?.(result.range)
			setAnnouncement(`Date range: ${plainDateFormat(plainDateFromISO(result.range.start)!, DATE_FORMAT_WITH_WEEKDAY, locale)} – ${plainDateFormat(plainDateFromISO(result.range.end)!, DATE_FORMAT_WITH_WEEKDAY, locale)}`)
		}
	}

	// Which day cell is tabbable: focused > selected > today > first enabled.
	const seedTabbable = (grid: CalendarMonthGrid): ISODateString | null => {
		if (focusIso) {
			for (const week of grid.weeks) for (const day of week) {
				if (day.iso === focusIso && !day.isOutsideMonth && !isDateDisabled(day.date)) return focusIso
			}
		}

		if (mode === 'single' && typeof currentValue === 'string') {
			for (const week of grid.weeks) for (const day of week) {
				if (day.iso === currentValue && !day.isOutsideMonth && !isDateDisabled(day.date)) return day.iso
			}
		}

		for (const week of grid.weeks) for (const day of week) {
			if (day.isToday && !day.isOutsideMonth && !isDateDisabled(day.date)) return day.iso
		}

		for (const week of grid.weeks) for (const day of week) {
			if (!day.isOutsideMonth && !isDateDisabled(day.date)) return day.iso
		}

		return null
	}

	const tabbable = months.map(seedTabbable)

	// All enabled in-month days across panes, for arrow navigation.
	const enabledDays = useMemo(() => {
		const all: ISODateString[] = []
		for (const grid of months) for (const week of grid.weeks) for (const day of week) {
			if (!day.isOutsideMonth && !isDateDisabled(day.date)) all.push(day.iso)
		}

		return all
	}, [months, isDateDisabled])

	const stepFocus = (deltaDays: number) => {
		if (!focusIso) return
		const pd = plainDateFromISO(focusIso)
		if (!pd) return
		let target = plainDateAddDays(pd, deltaDays)
		const dir = deltaDays >= 0 ? 1 : -1
		let guard = 0
		while (isDateDisabled(target) && guard++ < 370) target = plainDateAddDays(target, dir)
		if (guard >= 370) return
		const iso = plainDateToISO(target)
		setFocusIso(iso)
		const pane = monthStart(target)
		if (plainDateIsBefore(pane, baseMonth) || plainDateIsBefore(monthStart(plainDateAddMonths(baseMonth, numberOfMonths - 1)), pane)) {
			setBaseMonth(pane, { focusIso: iso })
			return
		}

		(root.current?.querySelector(`[data-date="${iso}"]`) as HTMLElement | null)?.focus()
	}

	const handleKeyDown = (e: any) => {
		if (mode === 'range' && rangeAnchor !== null && e.key === 'Escape') {
			setRangeAnchor(null)
			e.preventDefault()
			e.stopPropagation()
			return
		}

		if (!focusIso) return
		switch (e.key) {
			case 'ArrowLeft': e.preventDefault(); stepFocus(-1); break
			case 'ArrowRight': e.preventDefault(); stepFocus(1); break
			case 'ArrowUp': e.preventDefault(); stepFocus(-7); break
			case 'ArrowDown': e.preventDefault(); stepFocus(7); break
			case 'PageUp': {
				e.preventDefault()
				const pd = plainDateFromISO(focusIso)
				if (pd && bounds.canNavigatePrevious) {
					const target = plainDateAddMonths(pd, -1)
					setBaseMonth(monthStart(target), { focusIso: plainDateToISO(target) })
				}

				break
			}
			case 'PageDown': {
				e.preventDefault()
				const pd = plainDateFromISO(focusIso)
				if (pd && bounds.canNavigateNext) {
					const target = plainDateAddMonths(pd, 1)
					setBaseMonth(monthStart(target), { focusIso: plainDateToISO(target) })
				}

				break
			}
		}
	}

	// Preview band: anchor → hovered day while a range pick is in flight.
	const previewEnd = mode === 'range' && rangeAnchor && hoveredIso ? hoveredIso : null
	const previewRange: DateRange | undefined = previewEnd && rangeAnchor
		? (rangeAnchor <= previewEnd ? { start: rangeAnchor, end: previewEnd } : { start: previewEnd, end: rangeAnchor })
		: undefined

	const committedRange = typeof currentValue === 'object' && currentValue ? currentValue : undefined
	const bandRange = previewRange ?? committedRange

	const renderDay = (grid: CalendarMonthGrid, day: CalendarMonthGrid['weeks'][0][0]) => {
		const state = computeDayCellState(day, {
			mode,
			value: currentValue,
			rangeAnchor: mode === 'range' ? rangeAnchor : null,
			isDateDisabled,
		})

		if (previewRange && !day.isOutsideMonth && !state.isDisabled) {
			if (day.iso >= previewRange.start && day.iso <= previewRange.end && day.iso !== rangeAnchor) state.isInRange = true
			if (day.iso === previewRange.end && day.iso !== previewRange.start) state.isRangeEnd = true
		}

		const bandNeighbor = (iso: ISODateString): boolean => {
			if (!bandRange) return false
			const pd = plainDateFromISO(iso)
			if (!pd) return false
			if (pd.month !== grid.month || pd.year !== grid.year) return false
			if (isDateDisabled(pd)) return false
			return iso >= bandRange.start && iso <= bandRange.end
		}

		const rounding = computeCellRounding(state, {
			before: bandNeighbor(plainDateToISO(plainDateAddDays(day.date, -1))),
			after: bandNeighbor(plainDateToISO(plainDateAddDays(day.date, 1))),
		})

		if (day.isOutsideMonth) {
			return props.hasOutsideDays ?? true
				? <span key={day.iso} className="vx-calendar-day vx-calendar-day--outside" data-date={day.iso}>{day.dayOfMonth}</span>
				: <span key={day.iso} className="vx-calendar-day vx-calendar-day--empty" />
		}

		const isTabbable = tabbable.some((t) => t === day.iso)
		const fullLabel = plainDateFormat(day.date, DATE_FORMAT_WITH_WEEKDAY, locale)
		return (
			<button
				key={day.iso}
				type="button"
				data-date={day.iso}
				role="gridcell"
				className={cx(
					'vx-calendar-day',
					state.isSelected && 'vx-calendar-day--selected',
					state.isRangeStart && 'vx-calendar-day--range-start',
					state.isRangeEnd && 'vx-calendar-day--range-end',
					state.isInRange && 'vx-calendar-day--in-range',
					state.isPendingStart && 'vx-calendar-day--pending',
					state.isDisabled && 'vx-calendar-day--disabled',
					day.isToday && 'vx-calendar-day--today',
					day.isWeekend && 'vx-calendar-day--weekend',
					day.isSunday && 'vx-calendar-day--sunday',
					day.isFirstWeekOfMonth && 'vx-calendar-day--first-week',
					day.isLastWeekOfMonth && 'vx-calendar-day--last-week',
					rounding === 'both' && 'vx-calendar-day--round-both',
					rounding === 'start' && 'vx-calendar-day--round-start',
					rounding === 'end' && 'vx-calendar-day--round-end',
				)}
				tabIndex={isTabbable ? 0 : -1}
				disabled={state.isDisabled || undefined}
				aria-label={fullLabel}
				aria-pressed={dayCarriesBand(state) || state.isSelected ? true : undefined}
				onClick={() => pick(day.iso)}
				onFocus={() => setFocusIso(day.iso)}
				onMouseEnter={() => mode === 'range' && rangeAnchor && setHoveredIso(day.iso)}
				onMouseLeave={() => setHoveredIso(null)}
			>
				{day.dayOfMonth}
			</button>
		)
	}

	<div
		ref={(el: any) => { root.current = el }}
		id={props.id}
		className={cx('vx-calendar', mode === 'range' && 'vx-calendar--range', numberOfMonths === 2 && 'vx-calendar--two-months', props.className)}
		style={props.style}
		onKeyDown={handleKeyDown}
		{...props.web}
	>
		<div className="vx-calendar-header">
			<button
				type="button"
				className="vx-calendar-nav vx-calendar-nav--prev"
				aria-label="Previous month"
				disabled={!bounds.canNavigatePrevious || undefined}
				onClick={() => bounds.canNavigatePrevious && setBaseMonth(monthStart(plainDateAddMonths(baseMonth, -1)))}
			>
				<Icon name="xplat-chevron-left" size={16} />
			</button>
			<div className="vx-calendar-title" aria-hidden="true">{monthYearLabel}</div>
			<button
				type="button"
				className="vx-calendar-nav vx-calendar-nav--next"
				aria-label="Next month"
				disabled={!bounds.canNavigateNext || undefined}
				onClick={() => bounds.canNavigateNext && setBaseMonth(monthStart(plainDateAddMonths(baseMonth, 1)))}
			>
				<Icon name="xplat-chevron-right" size={16} />
			</button>
		</div>
		<div className="vx-calendar-months">
			{months.map((grid) => (
				<div key={`${grid.year}-${grid.month}`} className="vx-calendar-month">
					<div className="vx-calendar-weeknames" role="row">
						{props.hasWeekNumbers ? <span className="vx-calendar-weeknumber vx-calendar-weeknumber--head" /> : null}
						{grid.dayNames.map((name, i) => <span key={i} className="vx-calendar-weekname" role="columnheader">{name}</span>)}
					</div>
					{grid.weeks.map((week, w) => (
						<div key={w} className="vx-calendar-week" role="row">
							{props.hasWeekNumbers
								? <span className="vx-calendar-weeknumber" role="rowheader">{plainDateGetWeekNumber(week[0].date)}</span>
								: null}
							{week.map((day) => renderDay(grid, day))}
						</div>
					))}
				</div>
			))}
		</div>
		<div className="vx-calendar-live" aria-live="polite" role="status">{announcement}</div>
	</div>
}
