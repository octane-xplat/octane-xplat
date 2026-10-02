/** @jsxImportSource @nativescript-community/octane */
import { useImperativeHandle, useContext, useEffect, useId, useMemo, useRef, useState } from 'octane'
import type { DateTimeInputProps, ISODateString, ISODateTimeString, ISOTimeString } from './props'
import { cx } from './cx'
import { Icon } from './Icon'
import { Pressable } from './Pressable'
import { FormField } from './FormField'
import { Popover } from './Popover'
import { BottomSheet } from './BottomSheet'
import { FieldContext, useFieldControlProps } from './field-context'
import { nativeAccessibilityState } from './escape-props'
import { isWritingText, writeText } from './text-write'
import { blurText } from './text-focus'
import { Calendar } from './Calendar'
import { TimeWheelPanel } from './TimeWheelPanel'
import {
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

const STATUS_TEXT = { error: '⚠', warning: '⚠', success: '✓' } as const
const MINUTES_PER_DAY = 24 * 60

interface CoreProps extends DateTimeInputProps {
	surface: 'popover' | 'sheet'
}

function DateTimeInputControl(inputProps: CoreProps) @{
	const props = useFieldControlProps(inputProps)
	const surface = inputProps.surface
	const locale = resolveLocale()
	const generatedId = useId()
	const dateId = props.id ?? generatedId
	const anchor = useRef<any>(null)
	const dateInput = useRef<any>(null)
	const timeInput = useRef<any>(null)

	const [open, setOpen] = useState<'calendar' | 'times' | 'sheet' | null>(null)
	const [datePending, setDatePending] = useState<string | null>(null)
	const [timePending, setTimePending] = useState<string | null>(null)
	const [busy, setBusy] = useState(false)
	const [draft, setDraft] = useState<ISODateTimeString | null | undefined>(undefined)
	const [timeDraft, setTimeDraft] = useState<ISOTimeString | undefined>(undefined)

	const value = props.value
	const shown: ISODateTimeString | undefined = draft === undefined ? value : (draft ?? undefined)
	const isDisabled = !!props.isDisabled || !!props.isReadOnly
	const isBusy = !!props.isLoading || busy
	const hasSeconds = !!props.hasSeconds
	const formatDisplay = props.hourFormat === '24h' ? formatDisplayTime24h : formatDisplayTime12h

	const minParts = useMemo(() => splitDateTime(props.min), [props.min])
	const maxParts = useMemo(() => splitDateTime(props.max), [props.max])
	const valueParts = useMemo(() => splitDateTime(shown), [shown])

	const isDateDisabled = useMemo(
		() => createDateDisabledCheck({ min: minParts.date, max: maxParts.date, dateConstraints: props.dateConstraints }),
		[minParts.date, maxParts.date, props.dateConstraints],
	)

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

	const commitDate = (iso: ISODateString, fromPicker: boolean) => {
		let time = valueParts.time ?? timeDraft ?? currentISOTime(hasSeconds)
		if (minParts.date === iso && minParts.time && !isTimeInRange(time, minParts.time, undefined)) time = minParts.time
		if (maxParts.date === iso && maxParts.time && !isTimeInRange(time, undefined, maxParts.time)) time = maxParts.time
		setTimeDraft(undefined)
		fireChange(combineDateTime(iso, time))
		if (fromPicker) {
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

		if (valueParts.date) fireChange(combineDateTime(valueParts.date, time))
		else setTimeDraft(time)
	}

	// --- date segment (popover surface) ---
	const dateParsed = datePending != null && datePending.trim() ? parseDateInput(datePending, locale) : null
	const isDateValid = datePending == null || !datePending.trim() ? true : dateParsed !== null && !isDateDisabled(dateParsed)
	const dateDisplay = datePending ?? (valueParts.date ? formatDateValue(valueParts.date, 'date_long', locale) : '')

	const handleDateChange = (e: any) => {
		if (isDisabled || isWritingText(e.object)) return
		const text = e.value as string
		setDatePending(text)
		const parsed = parseDateInput(text, locale)
		if (parsed && !isDateDisabled(parsed)) commitDate(plainDateToISO(parsed), false)
	}

	const commitDatePending = () => {
		if (datePending == null) return
		if (!datePending.trim()) {
			if (shown != null) fireChange(undefined)
		} else {
			const parsed = parseDateInput(datePending, locale)
			if (parsed && !isDateDisabled(parsed)) commitDate(plainDateToISO(parsed), false)
		}

		setDatePending(null)
	}

	// --- time segment ---
	const timeParsed = timePending != null && timePending.trim() ? parseTimeInput(timePending, hasSeconds) : null
	const isTimeValid = timePending == null || !timePending.trim()
		? true
		: timeParsed !== null && isTimeInRange(timeParsed, timeMin, timeMax)

	const timeDisplay = timePending ?? ((timeDraft ?? valueParts.time) ? formatDisplay((timeDraft ?? valueParts.time)!, hasSeconds) : '')

	const handleTimeChange = (e: any) => {
		if (isDisabled || isWritingText(e.object)) return
		const text = e.value as string
		setTimePending(text)
		const parsed = parseTimeInput(text, hasSeconds)
		if (parsed && isTimeInRange(parsed, timeMin, timeMax)) commitTime(parsed)
	}

	const commitTimePending = () => {
		if (timePending == null) return
		if (!timePending.trim()) {
			if (valueParts.time) commitTime(undefined)
		} else {
			const parsed = parseTimeInput(timePending, hasSeconds)
			if (parsed && isTimeInRange(parsed, timeMin, timeMax)) commitTime(parsed)
		}

		setTimePending(null)
	}

	// Preset-time list (opt-in) — native uses an anchored Popover list.
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

	// Imperative display writes for both textfields.
	useEffect(() => {
		if (surface === 'popover') {
			if (dateInput.current && datePending == null) writeText(dateInput.current, dateDisplay)
			if (timeInput.current && timePending == null) writeText(timeInput.current, timeDisplay)
		}
	}, [dateDisplay, timeDisplay])

	const clear = () => {
		setDatePending(null)
		setTimePending(null)
		setTimeDraft(undefined)
		fireChange(undefined)
		if (dateInput.current) writeText(dateInput.current, '')
		if (timeInput.current) writeText(timeInput.current, '')
		dateInput.current?.focus?.()
	}

	const timeLabelText = props.timeLabel ?? `${props.fieldLabel ?? props.label ?? 'Date and time'} time`
	const statusText = props.status ? STATUS_TEXT[props.status.type] : null

	useImperativeHandle(props.ref, () => ({ focus: () => dateInput.current.focus(), blur: () => blurText(dateInput.current), native: dateInput.current }), undefined);

	<>
		<flexboxlayout
			ref={(v: any) => { anchor.current = v }}
			flexDirection="row"
			alignItems="center"
			className={cx(
				'vx-datetimeinput',
				`vx-datetimeinput--${surface}`,
				isDisabled && 'vx-datetimeinput--disabled',
				isBusy && 'vx-datetimeinput--loading',
				props.status && `vx-datetimeinput--status-${props.status.type}`,
				props.size && `vx-datetimeinput--size-${props.size}`,
				(!isDateValid || !isTimeValid) && 'vx-datetimeinput--invalid',
				props.className,
			)}
			style={props.style}
		>
			{surface === 'sheet' ? (
				<>
					<Pressable
						className={cx('vx-datetimeinput-segment', 'vx-datetimeinput-date', !valueParts.date && 'vx-datetimeinput-segment--placeholder')}
						disabled={isDisabled || isBusy}
						accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
						accessibilityState={{ disabled: isDisabled }}
						onPress={() => { if (!isDisabled && !isBusy) setOpen('sheet') }}
					>
						<label text={valueParts.date ? formatDateValue(valueParts.date, 'date_long', locale) : (props.placeholder ?? 'Select a date')} />
					</Pressable>
					<Pressable
						className={cx('vx-datetimeinput-segment', 'vx-datetimeinput-time', !(timeDraft ?? valueParts.time) && 'vx-datetimeinput-segment--placeholder')}
						disabled={isDisabled || isBusy}
						accessibilityLabel={timeLabelText}
						accessibilityState={{ disabled: isDisabled }}
						onPress={() => { if (!isDisabled && !isBusy) setOpen('sheet') }}
					>
						<label text={(timeDraft ?? valueParts.time) ? formatDisplay((timeDraft ?? valueParts.time)!, hasSeconds) : (props.timePlaceholder ?? 'Select a time')} />
					</Pressable>
				</>
			) : (
				<>
					<Pressable
						className="vx-datetimeinput-calendartoggle"
						accessibilityLabel={open === 'calendar' ? 'Close calendar' : 'Open calendar'}
						disabled={isDisabled || isBusy}
						onPress={() => { if (!isDisabled && !isBusy) setOpen(open === 'calendar' ? null : 'calendar') }}
					>
						<Icon name="xplat-calendar" size={14} />
					</Pressable>
					<textfield
						ref={(v: any) => { dateInput.current = v; }}
						id={dateId}
						className={cx('vx-datetimeinput-input', 'vx-datetimeinput-dateinput', !isDateValid && 'vx-datetimeinput-input--invalid')}
						hint={props.placeholder ?? 'Select a date'}
						isEnabled={!isDisabled && !isBusy}
						editable={!isDisabled && !isBusy}
						accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
						accessibilityHint={props.accessibilityHint}
						accessibilityState={nativeAccessibilityState({ disabled: isDisabled, busy: isBusy, required: props.isRequired && !props.isOptional, invalid: props.status?.type === 'error' || !isDateValid } as any) as any}
						onTextChange={handleDateChange}
						onBlur={commitDatePending}
						onReturnPress={commitDatePending}
						autocorrect={false}
					/>
					<textfield
						ref={(v: any) => { timeInput.current = v }}
						className={cx('vx-datetimeinput-input', 'vx-datetimeinput-timeinput', !isTimeValid && 'vx-datetimeinput-input--invalid')}
						hint={props.timePlaceholder ?? 'Select a time'}
						isEnabled={!isDisabled && !isBusy}
						editable={!isDisabled && !isBusy}
						accessibilityLabel={timeLabelText}
						accessibilityState={nativeAccessibilityState({ disabled: isDisabled, invalid: !isTimeValid } as any) as any}
						onTextChange={handleTimeChange}
						onBlur={commitTimePending}
						onReturnPress={commitTimePending}
						autocorrect={false}
					/>
					{timeOptions.length ? (
						<Pressable
							className="vx-datetimeinput-timestoggle"
							accessibilityLabel="Show preset times"
							disabled={isDisabled || isBusy}
							onPress={() => { if (!isDisabled && !isBusy) setOpen(open === 'times' ? null : 'times') }}
						>
							<Icon name="xplat-clock" size={14} />
						</Pressable>
					) : null}
				</>
			)}
			{props.hasClear && shown != null && !isDisabled && !isBusy
				? <Pressable className="vx-datetimeinput-clear" accessibilityLabel={`Clear ${props.fieldLabel ?? props.label ?? 'date and time'}`} onPress={clear}><label text="×" /></Pressable>
				: null}
			{statusText != null
				? <label className={cx('vx-field-icon', `vx-field-icon--${props.status!.type}`)} text={statusText} accessibilityLabel={props.statusVariant === 'tooltip' ? props.status?.message : undefined} />
				: null}
		</flexboxlayout>
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
				<scrollview className="vx-datetimeinput-timelist" accessibilityLabel={timeLabelText}>
					<stacklayout>
						{timeOptions.map((opt) => (
							<flexboxlayout
								key={opt.time}
								className={cx('vx-datetimeinput-timeoption', opt.time === (timeDraft ?? valueParts.time) && 'vx-datetimeinput-timeoption--selected')}
								accessibilityRole={"button" as any}
								accessibilityState={{ selected: opt.time === (timeDraft ?? valueParts.time) } as any}
								onTap={() => { commitTime(opt.time); setOpen(null) }}
							>
								<label text={opt.label} />
							</flexboxlayout>
						))}
					</stacklayout>
				</scrollview>
			</Popover>
		) : null}
		{surface === 'sheet' ? (
			<BottomSheet isOpen={open === 'sheet'} onOpenChange={(isOpen) => setOpen(isOpen ? 'sheet' : null)} label={props.label ?? props.accessibilityLabel ?? 'Choose a date and time'} height="hug" className="vx-datetimeinput-sheet">
				<flexboxlayout flexDirection="column" className="vx-datetimeinput-sheetbody">
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
				</flexboxlayout>
			</BottomSheet>
		) : null}
	</>
}

/** Combined date+time entry — date segment + time segment under one label.
 *  `popover` keeps typed segments with a calendar popover (and a preset-time
 *  list when `timeOptionInterval` is set); `bottom-sheet`/`native`/
 *  `adaptive-*` resolve to the self-drawn sheet on iOS/Android. */
export function DateTimeInput(props: DateTimeInputProps) @{
	const inField = useContext(FieldContext) != null
	const effective = effectivePresentation(props.presentation, props.nativePicker, 'datetime')
	const resolved = resolveInputSurface(effective, true)
	const surface: 'popover' | 'sheet' = resolved === 'popover' || resolved === 'typed' ? 'popover' : 'sheet'
	const cid = useId()

	const control = <DateTimeInputControl {...props} surface={surface} />

	<>
		{inField ? control : (
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
		)}
	</>
}
