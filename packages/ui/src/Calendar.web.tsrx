import { useImperativeHandle, useEffect, useMemo, useRef, useState } from 'octane'
import type { CalendarProps, DateRange, ISODateString } from './props'
import { cx } from './cx'
import { dateMessages } from './date-messages'
import { calendarKeyTarget, isDateComposing } from './date-keyboard'
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

/** Self-drawn month calendar — `single` or `range` selection, ISO values.
 *  Keyboard: arrows move the day (crossing months pages the grid), PageUp/
 *  PageDown move a month, Home/End move to the row edges, Enter/Space picks,
 *  Escape cancels an in-progress range. `ref` exposes `{navigateTo}`. */
export function Calendar(props: CalendarProps) @{
	const mode = props.mode ?? 'single'
	const numberOfMonths = props.numberOfMonths === 2 ? 2 : 1
	const weekStartsOn = normalizeDayOfWeek(props.weekStartsOn)
	const locale = resolveLocale(props.locale)
	const messages = dateMessages(props.messages)

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
		const el = root.current.querySelector(`button[data-date="${pendingFocus}"]:not([disabled])`) as HTMLElement | null
		if (!el) return
		el.focus()
		setFocusIso(pendingFocus)
		setPendingFocus(null)
	}, [pendingFocus, months])

	// ref → {navigateTo}
	const navApi = useRef({ navigateTo: (_: ISODateString) => {} })
	navApi.current = {
		navigateTo: (iso: ISODateString) => {
			const pd = plainDateFromISO(iso)
			if (pd) setBaseMonth(monthStart(pd))
		},
	}

	useImperativeHandle(props.ref, () => ({ navigateTo: (iso: ISODateString) => navApi.current.navigateTo(iso) }), [])

	const pick = (iso: ISODateString) => {
		const pd = plainDateFromISO(iso)
		if (!pd || isDateDisabled(pd)) return
		if (mode === 'single') {
			setAnnouncement(messages.selected(plainDateFormat(pd, DATE_FORMAT_WITH_WEEKDAY, locale)))
			if (!controlled) setInternalValue(iso)

			;(props.onChange as ((value: ISODateString, date: Date) => void) | undefined)?.(iso, plainDateToDate(pd))
			return
		}

		if (rangeAnchor === null) {
			setRangeAnchor(iso)
			setAnnouncement(messages.rangeStart(plainDateFormat(pd, DATE_FORMAT_WITH_WEEKDAY, locale)))
			return
		}

		const result = applyRangePick(rangeAnchor, iso, props.minRangeSpan)
		if (result.kind === 'cancel') {
			setRangeAnchor(null)
			setAnnouncement(messages.rangeCleared)
			return
		}

		if (result.kind === 'commit') {
			setRangeAnchor(null)
			if (!controlled) setInternalValue(result.range)

			;(props.onChange as ((value: DateRange) => void) | undefined)?.(result.range)
			setAnnouncement(messages.rangeSelected(plainDateFormat(plainDateFromISO(result.range.start)!, DATE_FORMAT_WITH_WEEKDAY, locale), plainDateFormat(plainDateFromISO(result.range.end)!, DATE_FORMAT_WITH_WEEKDAY, locale)))
		}
	}

	// One tab stop across both panes, repaired when constraints change.
	const enabledCells = months.flatMap((grid) => grid.weeks.flat()).filter((day) => !day.isOutsideMonth && !isDateDisabled(day.date))
	const selectedIso = typeof currentValue === 'string' ? currentValue : currentValue?.start
	const tabbable = enabledCells.find((day) => day.iso === focusIso)?.iso
		?? enabledCells.find((day) => day.iso === selectedIso)?.iso
		?? enabledCells.find((day) => day.isToday)?.iso
		?? enabledCells[0]?.iso

	useEffect(() => {
		const active = root.current?.querySelector('button[data-date]:focus') as HTMLButtonElement | null
		if (active?.disabled && tabbable) {
			;(root.current?.querySelector(`button[data-date="${tabbable}"]`) as HTMLElement | null)?.focus()
		}
	}, [tabbable, isDateDisabled])

	const handleKeyDown = (e: any) => {
		if (e.defaultPrevented || isDateComposing(e)) return
		// Header controls must retain their own keyboard behavior.
		const active = e.target?.closest?.('button[data-date]')
		if (!active || !root.current?.contains(active)) return
		if (mode === 'range' && rangeAnchor !== null && e.key === 'Escape') {
			setRangeAnchor(null)
			setAnnouncement(messages.rangeCleared)
			e.preventDefault()
			e.stopPropagation()
			return
		}

		if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) return
		const direction = props.direction ?? getComputedStyle(root.current!).direction
		const iso = calendarKeyTarget({ iso: active.dataset.date, event: e, months, isDisabled: isDateDisabled, rtl: direction === 'rtl', min: props.min, max: props.max })
		e.preventDefault()
		if (!iso) return
		const target = plainDateFromISO(iso)!
		const pane = monthStart(target)
		if (plainDateIsBefore(pane, baseMonth) || plainDateIsBefore(monthStart(plainDateAddMonths(baseMonth, numberOfMonths - 1)), pane)) {
			setBaseMonth(pane, { focusIso: iso })
			return
		}

		setFocusIso(iso)

		;(root.current?.querySelector(`button[data-date="${iso}"]`) as HTMLElement | null)?.focus()
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
				? <span key={day.iso} role="gridcell" className="vx-calendar-day vx-calendar-day--outside" data-date={day.iso}>{day.dayOfMonth}</span>
				: <span key={day.iso} role="gridcell" className="vx-calendar-day vx-calendar-day--empty" />
		}

		const isTabbable = tabbable === day.iso
		const dateLabel = plainDateFormat(day.date, DATE_FORMAT_WITH_WEEKDAY, locale)
		const fullLabel = state.isPendingStart || state.isRangeStart ? messages.rangeStart(dateLabel)
			: state.isRangeEnd ? messages.rangeEnd(dateLabel)
				: state.isInRange ? messages.inRange(dateLabel)
					: state.isSelected ? messages.selected(dateLabel) : dateLabel

		return (
			<div key={day.iso} className="vx-calendar-cell" role="gridcell" aria-selected={dayCarriesBand(state) || state.isSelected}>
				<button
					type="button"
					data-date={day.iso}
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
					aria-current={day.isToday ? 'date' : undefined}
					onClick={() => pick(day.iso)}
					onFocus={() => setFocusIso(day.iso)}
					onMouseEnter={() => mode === 'range' && rangeAnchor && setHoveredIso(day.iso)}
					onMouseLeave={() => setHoveredIso(null)}
				>
					{day.dayOfMonth}
				</button>
			</div>
		)
	}

	<div
		ref={(el: any) => { root.current = el }}
		dir={props.direction}
		lang={locale}
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
				aria-label={messages.previousMonth}
				disabled={!bounds.canNavigatePrevious || undefined}
				onClick={() => bounds.canNavigatePrevious && setBaseMonth(monthStart(plainDateAddMonths(baseMonth, -1)))}
			>
				<Icon name="xplat-chevron-left" size={16} />
			</button>
			<div className="vx-calendar-title" aria-hidden="true">{monthYearLabel}</div>
			<button
				type="button"
				className="vx-calendar-nav vx-calendar-nav--next"
				aria-label={messages.nextMonth}
				disabled={!bounds.canNavigateNext || undefined}
				onClick={() => bounds.canNavigateNext && setBaseMonth(monthStart(plainDateAddMonths(baseMonth, 1)))}
			>
				<Icon name="xplat-chevron-right" size={16} />
			</button>
		</div>
		<div className="vx-calendar-months">
			{months.map((grid) => (
				<div key={`${grid.year}-${grid.month}`} className="vx-calendar-month" role="grid" aria-label={monthLabel(grid.year, grid.month, locale)}>
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
