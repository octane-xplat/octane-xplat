import { useContext, useEffect, useId, useMemo, useRef, useState } from 'octane'
import type { DateTimeInputProps, ISODateString, ISODateTimeString, ISOTimeString } from './props'
import { cx } from './cx'
import { Icon } from './Icon.web.tsrx'
import { FormField } from './FormField.web.tsrx'
import { Popover } from './Popover.web.tsrx'
import { Sheet } from './Sheet.web.tsrx'
import { Tooltip } from './Tooltip.web.tsrx'
import { ActivityIndicator } from './ActivityIndicator.web.tsrx'
import { FieldContext, useFieldControlProps } from './field-context'
import { Calendar } from './Calendar.web.tsrx'
import { TimeWheelPanel } from './TimeWheelPanel.web.tsrx'
import {
	adjustTime,
	combineDateTime,
	currentISOTime,
	effectivePresentation,
	formatDateValue,
	formatDisplayTime12h,
	formatDisplayTime24h,
	formatISOTime,
	isTimeInRange,
	parseDateInput,
	parseISOTime,
	parseTimeInput,
	plainDateToISO,
	resolveInputSurface,
	resolveLocale,
	splitDateTime,
} from './datetime'

import { createDateDisabledCheck } from './calendar-core'

function isCoarsePointer(): boolean {
	try {
		return typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
	} catch {
		return false
	}
}

function useCoarsePointer(): boolean {
	const [coarse, setCoarse] = useState(isCoarsePointer)
	useEffect(() => {
		if (typeof matchMedia !== 'function') return
		const mq = matchMedia('(pointer: coarse)')
		const onChange = (e: any) => setCoarse(e.matches)
		mq.addEventListener?.('change', onChange)
		return () => mq.removeEventListener?.('change', onChange)
	}, [])

	return coarse
}

const STATUS_GLYPHS = { error: '⚠', warning: '⚠', success: '✓' } as const

const MINUTES_PER_DAY = 24 * 60

interface CoreProps extends DateTimeInputProps {
	surface: 'popover' | 'sheet' | 'native'
	nativeFallback: boolean
}

function DateTimeInputControl(inputProps: CoreProps) @{
	const props = useFieldControlProps(inputProps)
	const surface = inputProps.surface === 'native' && inputProps.nativeFallback ? 'popover' : inputProps.surface
	const locale = resolveLocale()
	const generatedId = useId()
	const dateId = props.id ?? generatedId
	const timeId = `${dateId}-time`
	const anchor = useRef<any>(null)
	const dateInput = useRef<HTMLInputElement | null>(null)
	const timeInput = useRef<HTMLInputElement | null>(null)

	const [open, setOpen] = useState<'calendar' | 'times' | 'sheet' | null>(null)
	const [datePending, setDatePending] = useState<string | null>(null)
	const [timePending, setTimePending] = useState<string | null>(null)
	const [isTimeFocused, setIsTimeFocused] = useState(false)
	const [busy, setBusy] = useState(false)
	const [draft, setDraft] = useState<ISODateTimeString | null | undefined>(undefined)
	const [announcement, setAnnouncement] = useState('')
	// Time picked before a date exists — combined on the date commit.
	const [timeDraft, setTimeDraft] = useState<ISOTimeString | undefined>(undefined)

	const value = props.value
	const shown: ISODateTimeString | undefined = draft === undefined ? value : (draft ?? undefined)
	const isDisabled = !!props.isDisabled || !!props.isReadOnly
	const isBusy = !!props.isLoading || busy
	const canClear = !!props.hasClear && shown != null && !isDisabled && !isBusy
	const showsDisabledReason = isDisabled && !!props.disabledMessage
	const hasSeconds = !!props.hasSeconds
	const formatDisplay = props.hourFormat === '24h' ? formatDisplayTime24h : formatDisplayTime12h

	const minParts = useMemo(() => splitDateTime(props.min), [props.min])
	const maxParts = useMemo(() => splitDateTime(props.max), [props.max])
	const valueParts = useMemo(() => splitDateTime(shown), [shown])

	const isDateDisabled = useMemo(
		() => createDateDisabledCheck({ min: minParts.date, max: maxParts.date, dateConstraints: props.dateConstraints }),
		[minParts.date, maxParts.date, props.dateConstraints],
	)

	// The day-bound min/max only bind the time segment when the picked day IS
	// the bound's day.
	const timeMin = minParts.date && minParts.time && valueParts.date === minParts.date ? minParts.time : undefined
	const timeMax = maxParts.date && maxParts.time && valueParts.date === maxParts.date ? maxParts.time : undefined

	const fireChange = (next: ISODateTimeString | undefined) => {
		if (isDisabled) return
		setDraft(next === undefined ? null : next)
		props.onChange?.(next)
		if (props.changeAction) {
			setBusy(true)
			Promise.resolve(props.changeAction(next)).finally(() => setBusy(false))
		}
	}

	useEffect(() => {
		if (draft !== undefined && value === (draft ?? undefined)) setDraft(undefined)
	}, [value])

	const commitDate = (iso: ISODateString, fromCalendar: boolean) => {
		let time = valueParts.time ?? timeDraft ?? currentISOTime(hasSeconds)
		if (minParts.date === iso && minParts.time && !isTimeInRange(time, minParts.time, undefined)) time = minParts.time
		if (maxParts.date === iso && maxParts.time && !isTimeInRange(time, undefined, maxParts.time)) time = maxParts.time
		setTimeDraft(undefined)
		fireChange(combineDateTime(iso, time))
		if (fromCalendar) {
			setDatePending(null)
			setOpen(null)
		}
	}

	const commitTime = (time: ISOTimeString | undefined) => {
		if (time === undefined) {
			setTimeDraft(undefined)
			if (shown !== undefined) fireChange(undefined)
			return
		}

		if (valueParts.date) {
			fireChange(combineDateTime(valueParts.date, time))
		} else {
			setTimeDraft(time)
		}
	}

	// --- date segment ---
	const dateParsed = datePending != null && datePending.trim() ? parseDateInput(datePending, locale) : null
	const isDateValid = datePending == null || !datePending.trim() ? true : dateParsed !== null && !isDateDisabled(dateParsed)
	const dateDisplay = datePending ?? (valueParts.date ? formatDateValue(valueParts.date, 'date_long', locale) : '')

	const handleDateType = (e: any) => {
		if (isDisabled) return
		const text = e.target.value as string
		setDatePending(text)
		const parsed = parseDateInput(text, locale)
		if (parsed && !isDateDisabled(parsed)) commitDate(plainDateToISO(parsed), false)
	}

	const handleDateBlur = () => {
		if (datePending == null) return
		if (!datePending.trim()) {
			if (shown != null) fireChange(undefined)
		} else {
			const parsed = parseDateInput(datePending, locale)
			if (parsed && !isDateDisabled(parsed)) commitDate(plainDateToISO(parsed), false)
		}

		setDatePending(null)
	}

	const handleDateKey = (e: any) => {
		if (e.isComposing || e.keyCode === 229) return
		if (e.key === 'ArrowDown' && surface === 'popover' && !isDisabled) { e.preventDefault(); setOpen('calendar') }
		else if (e.key === 'Escape' && open) { e.preventDefault(); setOpen(null) }
	}

	// --- time segment ---
	const timeParsed = timePending != null && timePending.trim() ? parseTimeInput(timePending, hasSeconds) : null
	const isTimeValid = timePending == null || !timePending.trim()
		? true
		: timeParsed !== null && isTimeInRange(timeParsed, timeMin, timeMax)

	const timeDisplay = timePending ?? (valueParts.time ? formatDisplay(valueParts.time, hasSeconds) : '')

	const handleTimeType = (e: any) => {
		if (isDisabled) return
		const text = e.target.value as string
		setTimePending(text)
		const parsed = parseTimeInput(text, hasSeconds)
		if (parsed && isTimeInRange(parsed, timeMin, timeMax)) commitTime(parsed)
	}

	const handleTimeBlur = () => {
		setIsTimeFocused(false)
		if (timePending == null) return
		if (!timePending.trim()) {
			if (valueParts.time) commitTime(undefined)
		} else {
			const parsed = parseTimeInput(timePending, hasSeconds)
			if (parsed && isTimeInRange(parsed, timeMin, timeMax)) commitTime(parsed)
		}

		setTimePending(null)
	}

	const handleTimeKey = (e: any) => {
		if (e.isComposing || e.keyCode === 229 || isDisabled) return
		if (e.key === 'ArrowDown' && props.timeOptionInterval && surface !== 'sheet') { e.preventDefault(); setOpen('times'); return }
		if (e.key === 'Escape' && open === 'times') { e.preventDefault(); setOpen(null); return }
		if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
			e.preventDefault()
			const step = props.timeIncrement ?? 1
			const base = valueParts.time ?? currentISOTime(hasSeconds)
			const next = adjustTime(base, e.key === 'ArrowUp' ? step : -step, hasSeconds)
			if (isTimeInRange(next, timeMin, timeMax)) {
				commitTime(next)
				setAnnouncement(formatDisplay(next, hasSeconds))
			}
		}
	}

	// Preset-time list (opt-in via timeOptionInterval) — same bound the typed
	// path enforces, so no uncommittable option is listed.
	const timeOptions = useMemo(() => {
		if (!props.timeOptionInterval) return []
		const list: { time: ISOTimeString; label: string }[] = []
		for (let m = 0; m < MINUTES_PER_DAY; m += props.timeOptionInterval) {
			const t = formatISOTime({ hour: Math.floor(m / 60), minute: m % 60, second: 0 }, hasSeconds)
			if (!isTimeInRange(t, timeMin, timeMax)) continue
			list.push({ time: t, label: formatDisplay(t, hasSeconds) })
		}

		return list
	}, [props.timeOptionInterval, hasSeconds, timeMin, timeMax])

	// --- native segment commits -------------------------------------------
	const lastDateCommit = useRef<string | null>(null)
	const handleNativeDate = (e: any) => {
		const raw = (e.target.value ?? '') as string
		if (lastDateCommit.current === raw) return
		lastDateCommit.current = raw
		if (!raw) { fireChange(undefined); return }
		const parsed = parseDateInput(raw, locale)
		if (parsed && !isDateDisabled(parsed)) commitDate(plainDateToISO(parsed), false)
	}

	const lastTimeCommit = useRef<string | null>(null)
	const handleNativeTime = (e: any) => {
		const raw = (e.target.value ?? '') as string
		if (lastTimeCommit.current === raw) return
		lastTimeCommit.current = raw
		if (!raw) { commitTime(undefined); return }
		const parsed = parseTimeInput(raw, true)
		if (parsed && isTimeInRange(parsed, timeMin, timeMax)) commitTime(formatISOTime(parseISOTime(parsed)!, hasSeconds))
	}

	const clear = () => {
		setDatePending(null)
		setTimePending(null)
		setTimeDraft(undefined)
		fireChange(undefined)
		dateInput.current?.focus({ preventScroll: true })
	}

	const timeLabelText = props.timeLabel ?? `${props.fieldLabel ?? props.label ?? 'Date and time'} time`
	const statusType = props.status?.type

	const shellNode = (
		<div
			ref={(el: any) => { anchor.current = el }}
			className={cx(
				'vx-datetimeinput',
				`vx-datetimeinput--${surface}`,
				isDisabled && 'vx-datetimeinput--disabled',
				isBusy && 'vx-datetimeinput--loading',
				statusType && `vx-datetimeinput--status-${statusType}`,
				props.size && `vx-datetimeinput--size-${props.size}`,
				(!isDateValid || !isTimeValid) && 'vx-datetimeinput--invalid',
				props.className,
			)}
			style={props.style}
		>
			{surface === 'sheet' ? (
				<>
					<button
						type="button"
						className={cx('vx-datetimeinput-segment', 'vx-datetimeinput-date', !valueParts.date && 'vx-datetimeinput-segment--placeholder')}
						disabled={isDisabled || isBusy || undefined}
						aria-label={props.ariaLabel}
						aria-labelledby={props.ariaLabelledBy}
						aria-describedby={props.ariaDescribedBy}
						onClick={() => setOpen('sheet')}
					>
						<Icon name="xplat-calendar" size={14} /> {valueParts.date ? formatDateValue(valueParts.date, 'date_long', locale) : (props.placeholder ?? 'Select a date')}
					</button>
					<button
						type="button"
						className={cx('vx-datetimeinput-segment', 'vx-datetimeinput-time', !(timeDraft ?? valueParts.time) && 'vx-datetimeinput-segment--placeholder')}
						disabled={isDisabled || isBusy || undefined}
						aria-label={timeLabelText}
						onClick={() => setOpen('sheet')}
					>
						<Icon name="xplat-clock" size={14} /> {(timeDraft ?? valueParts.time) ? formatDisplay((timeDraft ?? valueParts.time)!, hasSeconds) : (props.timePlaceholder ?? 'Select a time')}
					</button>
				</>
			) : surface === 'native' ? (
				<>
					<span className="vx-datetimeinput-segment vx-datetimeinput-nativeslot">
						<input
							ref={(el: any) => { dateInput.current = el; if (!el) return; props.bind?.({ focus: () => el.focus(), blur: () => el.blur(), native: el }) }}
							id={dateId}
							type="date"
							className="vx-datetimeinput-input vx-datetimeinput-nativeinput"
							value={valueParts.date ?? ''}
							min={minParts.date}
							max={maxParts.date}
							disabled={isDisabled && !showsDisabledReason || undefined}
							aria-disabled={showsDisabledReason || undefined}
							readOnly={showsDisabledReason || undefined}
							aria-label={props.ariaLabel}
							aria-labelledby={props.ariaLabelledBy}
							aria-describedby={props.ariaDescribedBy}
							aria-required={props.isRequired && !props.isOptional || undefined}
							aria-invalid={statusType === 'error' || undefined}
							aria-busy={isBusy || undefined}
							onChange={handleNativeDate}
							onInput={handleNativeDate}
						/>
						<span className="vx-datetimeinput-overlay" aria-hidden="true">
							{valueParts.date ? formatDateValue(valueParts.date, 'date_long', locale) : <span className="vx-datetimeinput-overlay--placeholder">{props.placeholder ?? 'Select a date'}</span>}
						</span>
					</span>
					<span className="vx-datetimeinput-segment vx-datetimeinput-nativeslot">
						<input
							ref={(el: any) => { timeInput.current = el }}
							id={timeId}
							type="time"
							className="vx-datetimeinput-input vx-datetimeinput-nativeinput"
							value={(timeDraft ?? valueParts.time) ?? ''}
							min={timeMin}
							max={timeMax}
							step={hasSeconds ? 1 : 60}
							disabled={isDisabled && !showsDisabledReason || undefined}
							aria-disabled={showsDisabledReason || undefined}
							readOnly={showsDisabledReason || undefined}
							aria-label={timeLabelText}
							aria-describedby={props.ariaDescribedBy}
							aria-invalid={statusType === 'error' || undefined}
							onChange={handleNativeTime}
							onInput={handleNativeTime}
						/>
						<span className="vx-datetimeinput-overlay" aria-hidden="true">
							{(timeDraft ?? valueParts.time) ? formatDisplay((timeDraft ?? valueParts.time)!, hasSeconds) : <span className="vx-datetimeinput-overlay--placeholder">{props.timePlaceholder ?? 'Select a time'}</span>}
						</span>
					</span>
				</>
			) : (
				<>
					<span className="vx-datetimeinput-segment vx-datetimeinput-datesegment">
						<button
							type="button"
							className="vx-datetimeinput-calendartoggle"
							aria-label={open === 'calendar' ? 'Close calendar' : 'Open calendar'}
							disabled={isDisabled || isBusy || undefined}
							tabIndex={-1}
							onClick={() => setOpen(open === 'calendar' ? null : 'calendar')}
						>
							<Icon name="xplat-calendar" size={14} />
						</button>
						<input
							ref={(el: any) => { dateInput.current = el; if (!el) return; props.bind?.({ focus: () => el.focus(), blur: () => el.blur(), native: el }) }}
							id={dateId}
							type="text"
							className={cx('vx-datetimeinput-input', 'vx-datetimeinput-dateinput', !isDateValid && 'vx-datetimeinput-input--invalid')}
							value={dateDisplay}
							placeholder={props.placeholder ?? 'Select a date'}
							disabled={isDisabled && !showsDisabledReason || undefined}
							aria-disabled={showsDisabledReason || undefined}
							readOnly={showsDisabledReason || isBusy || undefined}
							aria-label={props.ariaLabel}
							aria-labelledby={props.ariaLabelledBy}
							aria-describedby={props.ariaDescribedBy}
							aria-required={props.isRequired && !props.isOptional || undefined}
							aria-invalid={statusType === 'error' || !isDateValid || undefined}
							aria-busy={isBusy || undefined}
							aria-expanded={open === 'calendar'}
							aria-haspopup="dialog"
							onInput={handleDateType}
							onBlur={handleDateBlur}
							onKeyDown={handleDateKey}
						/>
					</span>
					<span className="vx-datetimeinput-segment vx-datetimeinput-timesegment">
						<input
							ref={(el: any) => { timeInput.current = el }}
							id={timeId}
							type="text"
							role={timeOptions.length ? 'combobox' : undefined}
							className={cx('vx-datetimeinput-input', 'vx-datetimeinput-timeinput', !isTimeValid && 'vx-datetimeinput-input--invalid')}
							value={timeDisplay}
							placeholder={isTimeFocused && !timeDisplay ? (props.hourFormat === '24h' ? 'e.g., 14:30' : 'e.g., 2:30 PM') : (props.timePlaceholder ?? 'Select a time')}
							disabled={isDisabled && !showsDisabledReason || undefined}
							aria-disabled={showsDisabledReason || undefined}
							readOnly={showsDisabledReason || isBusy || undefined}
							aria-label={timeLabelText}
							aria-describedby={props.ariaDescribedBy}
							aria-invalid={statusType === 'error' || !isTimeValid || undefined}
							aria-expanded={timeOptions.length ? open === 'times' : undefined}
							aria-haspopup={timeOptions.length ? 'listbox' : undefined}
							onInput={handleTimeType}
							onFocus={() => { if (!isDisabled) { setIsTimeFocused(true); if (timeOptions.length && open !== 'times') setOpen('times') } }}
							onBlur={handleTimeBlur}
							onKeyDown={handleTimeKey}
						/>
					</span>
				</>
			)}
			{canClear ? <button type="button" className="vx-datetimeinput-clear" aria-label={`Clear ${props.fieldLabel ?? props.label ?? 'date and time'}`} onClick={clear}>{'×'}</button> : null}
			{isBusy ? <ActivityIndicator busy className="vx-datetimeinput-spinner" /> : null}
			{statusType ? <span className={cx('vx-field-icon', `vx-field-icon--${statusType}`)}>{STATUS_GLYPHS[statusType]}</span> : null}
		</div>
	)

	<>
		{showsDisabledReason ? <Tooltip trigger={shellNode} content={props.disabledMessage!} /> : shellNode}
		{surface === 'popover' ? (
			<Popover anchor={anchor} open={open === 'calendar'} onDismiss={() => setOpen(null)} placement="bottom" className="vx-datetimeinput-popover">
				<Calendar
					mode="single"
					value={valueParts.date}
					onChange={(iso: ISODateString) => commitDate(iso, true)}
					min={minParts.date}
					max={maxParts.date}
					dateConstraints={props.dateConstraints}
					numberOfMonths={props.numberOfMonths}
					weekStartsOn={props.weekStartsOn}
				/>
			</Popover>
		) : null}
		{surface === 'popover' && timeOptions.length ? (
			<Popover anchor={anchor} open={open === 'times'} onDismiss={() => setOpen(null)} placement="bottom" className="vx-datetimeinput-times">
				<div role="listbox" aria-label={timeLabelText} className="vx-datetimeinput-timelist">
					{timeOptions.map((opt) => (
						<button
							key={opt.time}
							type="button"
							role="option"
							aria-selected={opt.time === (timeDraft ?? valueParts.time)}
							className={cx('vx-datetimeinput-timeoption', opt.time === (timeDraft ?? valueParts.time) && 'vx-datetimeinput-timeoption--selected')}
							onMouseDown={(e: any) => { e.preventDefault(); commitTime(opt.time); setOpen(null) }}
						>
							{opt.label}
						</button>
					))}
				</div>
			</Popover>
		) : null}
		{surface === 'sheet' ? (
			<Sheet open={open === 'sheet'} onDismiss={() => setOpen(null)} className="vx-datetimeinput-sheet">
				<div className="vx-datetimeinput-sheetbody">
					<Calendar
						mode="single"
						value={valueParts.date}
						onChange={(iso: ISODateString) => commitDate(iso, true)}
						min={minParts.date}
						max={maxParts.date}
						dateConstraints={props.dateConstraints}
						numberOfMonths={1}
						weekStartsOn={props.weekStartsOn}
					/>
					<TimeWheelPanel
						value={timeDraft ?? valueParts.time}
						hasSeconds={hasSeconds}
						hourFormat={props.hourFormat ?? '12h'}
						min={timeMin}
						max={timeMax}
						onCommit={(t) => { commitTime(t); setOpen(null) }}
						onDismiss={() => setOpen(null)}
					/>
				</div>
			</Sheet>
		) : null}
		<div className="vx-sr-only" aria-live="polite" role="status">{announcement}</div>
		<div className="vx-sr-only" aria-live="assertive" role="alert">{!isDateValid || !isTimeValid ? 'Enter a valid date and time' : ''}</div>
	</>
}

/** Combined date+time entry — date segment + time segment under one label,
 *  commits combining into `YYYY-MM-DDTHH:MM[:SS]`. `presentation` resolves
 *  both segments' surfaces together; the adaptive/legacy `native` path keeps
 *  Astryx segments when `hasSeconds`, a non-default `timeIncrement`, or
 *  `timeOptionInterval` can't be expressed by OS controls. */
export function DateTimeInput(props: DateTimeInputProps) @{
	const inField = useContext(FieldContext) != null
	const isTouch = useCoarsePointer()
	const effective = effectivePresentation(props.presentation, props.nativePicker, 'datetime')
	const surface = resolveInputSurface(effective, isTouch)
	const nativeFallback = surface === 'native' && effective !== 'native' && (
		!!props.hasSeconds || (props.timeIncrement ?? 1) !== 1 || props.timeOptionInterval !== undefined
	)

	const cid = useId()
	const concrete: 'popover' | 'sheet' | 'native' = surface === 'typed' ? 'popover' : surface

	const control = <DateTimeInputControl {...props} surface={concrete} nativeFallback={nativeFallback} />
	if (inField) return control
	return (
		<FormField
			inputID={props.id ?? cid}
			label={props.label}
			isLabelHidden={props.isLabelHidden}
			description={props.description}
			isDisabled={props.isDisabled}
			disabledMessage={props.disabledMessage}
			isReadOnly={props.isReadOnly}
			isLoading={props.isLoading}
			isRequired={props.isRequired}
			isOptional={props.isOptional}
			size={props.size}
			status={props.status}
			statusVariant={props.statusVariant}
			labelTooltip={props.labelTooltip}
			width={props.width}
		>
			{control}
		</FormField>
	)
}
