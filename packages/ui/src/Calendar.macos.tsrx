/** @jsxImportSource @octane-xplat/macos-renderer */
import { useImperativeHandle, useEffect, useMemo, useRef, useState } from 'octane'
import type { CalendarProps, DateRange, ISODateString } from './props'
import { cx } from './cx'
import { Icon } from './Icon.macos.tsrx'
import { Pressable } from './Pressable.macos.tsrx'
import {
	DATE_FORMAT_WITH_WEEKDAY,
	normalizeDayOfWeek,
	plainDateAddDays,
	plainDateAddMonths,
	plainDateFormat,
	plainDateFromISO,
	plainDateGetWeekNumber,
	plainDateToDate,
	plainDateToISO,
	resolveLocale,
} from './datetime'

import {
	applyRangePick,
	buildMonthGrid,
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
 *  macOS leaf: same tap-driven grid as native; `ref` exposes
 *  `{navigateTo}`. */
export function Calendar(props: CalendarProps) @{
	const mode = props.mode ?? 'single'
	const numberOfMonths = props.numberOfMonths === 2 ? 2 : 1
	const weekStartsOn = normalizeDayOfWeek(props.weekStartsOn)
	const locale = resolveLocale()

	const controlled = props.value !== undefined
	const [internalValue, setInternalValue] = useState<ISODateString | DateRange | undefined>(props.defaultValue as ISODateString | DateRange | undefined)
	const currentValue: ISODateString | DateRange | undefined = controlled ? props.value : internalValue

	const [rangeAnchor, setRangeAnchor] = useState<ISODateString | null>(null)
	const [announcement, setAnnouncement] = useState('')

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

	const setBaseMonth = (next: ReturnType<typeof monthStart>) => {
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

	const firstLabel = useRef(true)
	useEffect(() => {
		if (firstLabel.current) { firstLabel.current = false; return }
		setAnnouncement(monthYearLabel)
	}, [monthYearLabel])

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

	const renderDay = (grid: CalendarMonthGrid, day: CalendarMonthGrid['weeks'][0][0]) => {
		const state = computeDayCellState(day, {
			mode,
			value: currentValue,
			rangeAnchor: mode === 'range' ? rangeAnchor : null,
			isDateDisabled,
		})

		if (day.isOutsideMonth) {
			return props.hasOutsideDays ?? true
				? <label key={day.iso} className="vx-calendar-day vx-calendar-day--outside" text={String(day.dayOfMonth)} />
				: <label key={day.iso} className="vx-calendar-day vx-calendar-day--empty" />
		}

		const fullLabel = plainDateFormat(day.date, DATE_FORMAT_WITH_WEEKDAY, locale)
		return (
			<flexboxlayout
				key={day.iso}
				onTap={state.isDisabled ? undefined : () => pick(day.iso)}
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
				)}
				accessibilityLabel={fullLabel}
				accessibilityRole={"button" as any}
				accessibilityState={{ disabled: state.isDisabled, selected: dayCarriesBand(state) || state.isSelected } as any}
			>
				<label text={String(day.dayOfMonth)} />
			</flexboxlayout>
		)
	}

	<flexboxlayout
		flexDirection="column"
		id={props.id}
		className={cx('vx-calendar', mode === 'range' && 'vx-calendar--range', numberOfMonths === 2 && 'vx-calendar--two-months', props.className)}
		style={props.style}
	>
		<flexboxlayout flexDirection="row" alignItems="center" className="vx-calendar-header">
			<Pressable
				className="vx-calendar-nav vx-calendar-nav--prev"
				accessibilityLabel="Previous month"
				accessibilityState={{ disabled: !bounds.canNavigatePrevious } as any}
				disabled={!bounds.canNavigatePrevious}
				onPress={() => bounds.canNavigatePrevious && setBaseMonth(monthStart(plainDateAddMonths(baseMonth, -1)))}
			>
				<Icon name="xplat-chevron-left" size={16} />
			</Pressable>
			<label className="vx-calendar-title" text={monthYearLabel} flexGrow={1} textAlignment="center" />
			<Pressable
				className="vx-calendar-nav vx-calendar-nav--next"
				accessibilityLabel="Next month"
				accessibilityState={{ disabled: !bounds.canNavigateNext } as any}
				disabled={!bounds.canNavigateNext}
				onPress={() => bounds.canNavigateNext && setBaseMonth(monthStart(plainDateAddMonths(baseMonth, 1)))}
			>
				<Icon name="xplat-chevron-right" size={16} />
			</Pressable>
		</flexboxlayout>
		<flexboxlayout flexDirection="column" className="vx-calendar-months">
			{months.map((grid) => (
				<flexboxlayout key={`${grid.year}-${grid.month}`} flexDirection="column" className="vx-calendar-month">
					<flexboxlayout flexDirection="row" className="vx-calendar-weeknames">
						{props.hasWeekNumbers ? <label className="vx-calendar-weeknumber vx-calendar-weeknumber--head" /> : null}
						{grid.dayNames.map((name, i) => <label key={i} className="vx-calendar-weekname" text={name} />)}
					</flexboxlayout>
					{grid.weeks.map((week, w) => (
						<flexboxlayout key={w} flexDirection="row" className="vx-calendar-week">
							{props.hasWeekNumbers
								? <label className="vx-calendar-weeknumber" text={String(plainDateGetWeekNumber(week[0].date))} />
								: null}
							{week.map((day) => renderDay(grid, day))}
						</flexboxlayout>
					))}
				</flexboxlayout>
			))}
		</flexboxlayout>
		<label className="vx-calendar-live" text={announcement} />
	</flexboxlayout>
}
