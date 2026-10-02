/** @jsxImportSource @octane-xplat/macos-renderer */
import { useContext, useEffect, useId, useMemo, useRef, useState } from 'octane'
import type { DateTimeInputProps, ISODateString, ISODateTimeString, ISOTimeString } from './props'
import { cx } from './cx'
import { dateMessages } from './date-messages'
import { hasDateComposition } from './date-composition'
import { runDateChangeAction } from './date-field-action'
import { Icon } from './Icon.macos.tsrx'
import { Pressable } from './Pressable.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'
import { Popover } from './Popover.macos.tsrx'
import { FieldContext, useFieldControlProps } from './field-context'
import { Calendar } from './Calendar.macos.tsrx'
import {
	combineDateTime,
	currentISOTime,
	formatDateValue,
	formatDisplayTime12h,
	formatLocalizedTime,
	formatDisplayTime24h,
	formatISOTime,
	isTimeInRange,
	parseDateInput,
	parseTimeInput,
	plainDateToISO,
	resolveLocale,
	splitDateTime,
} from './datetime'

import { createDateDisabledCheck } from './calendar-core'

const STATUS_TEXT = { error: '⚠', warning: '⚠', success: '✓' } as const
const MINUTES_PER_DAY = 24 * 60

function DateTimeInputControl(inputProps: DateTimeInputProps) @{
	const props = useFieldControlProps(inputProps)
	const locale = resolveLocale(props.locale)
	const messages = dateMessages(props.messages)
	const generatedId = useId()
	const dateId = props.id ?? generatedId
	const dateInput = useRef<any>(null)
	const timeInput = useRef<any>(null)
	const anchor = useRef<any>(null)

	const [open, setOpen] = useState<'calendar' | 'times' | null>(null)
	const [datePending, setDatePending] = useState<string | null>(null)
	const [timePending, setTimePending] = useState<string | null>(null)
	const [busy, setBusy] = useState(false)
	const [timeDraft, setTimeDraft] = useState<ISOTimeString | undefined>(undefined)

	const lastEmitted = useRef<ISODateTimeString | undefined>(undefined)
	const value = props.value
	const shown = value
	const isDisabled = !!props.isDisabled || !!props.isReadOnly
	const isBusy = !!props.isLoading || busy
	const hasSeconds = !!props.hasSeconds
	const formatDisplay = (time: ISOTimeString, seconds: boolean) => props.locale
		? formatLocalizedTime(time, seconds, props.hourFormat ?? '12h', resolveLocale(props.locale))
		: (props.hourFormat === '24h' ? formatDisplayTime24h : formatDisplayTime12h)(time, seconds)

	const minParts = useMemo(() => splitDateTime(props.min), [props.min])
	const maxParts = useMemo(() => splitDateTime(props.max), [props.max])
	const valueParts = useMemo(() => splitDateTime(shown), [shown])

	const isDateDisabled = useMemo(
		() => createDateDisabledCheck({ min: minParts.date, max: maxParts.date, dateConstraints: props.dateConstraints }),
		[minParts.date, maxParts.date, props.dateConstraints],
	)

	const timeMin = minParts.date && minParts.time && valueParts.date === minParts.date ? minParts.time : undefined
	const timeMax = maxParts.date && maxParts.time && valueParts.date === maxParts.date ? maxParts.time : undefined

	// Preserve typing on an echoed edit; external values replace the draft.
	useEffect(() => {
		if (value !== lastEmitted.current) {
			setDatePending(null)
			setTimePending(null)
			setTimeDraft(undefined)
		}

		lastEmitted.current = undefined
	}, [value])

	const fireChange = (next: ISODateTimeString | undefined) => {
		if (isDisabled || isBusy) return
		lastEmitted.current = next
		props.onChange?.(next)
		if (props.changeAction) {
			setBusy(true)
			runDateChangeAction(() => props.changeAction!(next), () => setBusy(false))
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

	const dateParsed = datePending != null && datePending.trim() ? parseDateInput(datePending, locale) : null
	const isDateValid = datePending == null || !datePending.trim() ? true : dateParsed !== null && !isDateDisabled(dateParsed)
	const dateDisplay = datePending ?? (valueParts.date ? formatDateValue(valueParts.date, 'date_long', locale) : '')

	const handleDateChange = (text: string) => {
		if (isDisabled) return
		setDatePending(text)
		if (hasDateComposition(dateInput.current)) return
		const parsed = parseDateInput(text, locale)
		if (parsed && !isDateDisabled(parsed)) commitDate(plainDateToISO(parsed), false)
	}

	const commitDatePending = () => {
		if (hasDateComposition(dateInput.current)) return
		if (datePending == null) return
		if (!datePending.trim()) {
			if (shown != null) fireChange(undefined)
		} else {
			const parsed = parseDateInput(datePending, locale)
			if (parsed && !isDateDisabled(parsed)) commitDate(plainDateToISO(parsed), false)
		}

		setDatePending(null)
	}

	const timeParsed = timePending != null && timePending.trim() ? parseTimeInput(timePending, hasSeconds) : null
	const isTimeValid = timePending == null || !timePending.trim()
		? true
		: timeParsed !== null && isTimeInRange(timeParsed, timeMin, timeMax)

	const timeDisplay = timePending ?? ((timeDraft ?? valueParts.time) ? formatDisplay((timeDraft ?? valueParts.time)!, hasSeconds) : '')

	const handleTimeChange = (text: string) => {
		if (isDisabled) return
		setTimePending(text)
		if (hasDateComposition(timeInput.current)) return
		const parsed = parseTimeInput(text, hasSeconds)
		if (parsed && isTimeInRange(parsed, timeMin, timeMax)) commitTime(parsed)
	}

	const commitTimePending = () => {
		if (hasDateComposition(timeInput.current)) return
		if (timePending == null) return
		if (!timePending.trim()) {
			if (valueParts.time) commitTime(undefined)
		} else {
			const parsed = parseTimeInput(timePending, hasSeconds)
			if (parsed && isTimeInRange(parsed, timeMin, timeMax)) commitTime(parsed)
		}

		setTimePending(null)
	}

	const timeOptions = useMemo(() => {
		if (!props.timeOptionInterval) return []
		const list: { time: ISOTimeString; label: string }[] = []
		for (let m = 0; m < MINUTES_PER_DAY; m += props.timeOptionInterval) {
			const t = formatISOTime({ hour: Math.floor(m / 60), minute: m % 60, second: 0 }, hasSeconds)
			if (!isTimeInRange(t, timeMin, timeMax)) continue
			list.push({ time: t, label: formatDisplay(t, hasSeconds) })
		}

		return list
	}, [props.timeOptionInterval, hasSeconds, timeMin, timeMax, props.hourFormat, props.locale])

	const clear = () => {
		setDatePending(null)
		setTimePending(null)
		setTimeDraft(undefined)
		fireChange(undefined)
	}

	const timeLabelText = props.timeLabel ?? `${props.fieldLabel ?? props.label ?? 'Date and time'} time`
	const statusText = props.status ? STATUS_TEXT[props.status.type] : null

	<>
		<flexboxlayout
			ref={(v: any) => { anchor.current = v }}
			flexDirection="row"
			alignItems="center"
			className={cx(
				'vx-datetimeinput',
				'vx-datetimeinput-popover',
				isDisabled && 'vx-datetimeinput--disabled',
				isBusy && 'vx-datetimeinput--loading',
				props.status && `vx-datetimeinput--status-${props.status.type}`,
				props.size && `vx-datetimeinput--size-${props.size}`,
				(!isDateValid || !isTimeValid) && 'vx-datetimeinput--invalid',
				props.className,
			)}
			style={props.style}
		>
			<Pressable
				className="vx-datetimeinput-calendartoggle"
				accessibilityLabel={open === 'calendar' ? messages.closeCalendar : messages.openCalendar}
				disabled={isDisabled || isBusy}
				onPress={() => { if (!isDisabled && !isBusy) setOpen(open === 'calendar' ? null : 'calendar') }}
			>
				<Icon name="xplat-calendar" size={14} />
			</Pressable>
			<textfield
				ref={(v: any) => { dateInput.current = v }}
				id={dateId}
				className={cx('vx-datetimeinput-input', 'vx-datetimeinput-dateinput', !isDateValid && 'vx-datetimeinput-input--invalid')}
				value={dateDisplay}
				placeholder={props.placeholder ?? 'Select a date'}
				isEnabled={!isDisabled && !isBusy}
				editable={!isDisabled && !isBusy}
				onTextChange={handleDateChange}
				onBlur={commitDatePending}
				accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
				accessibilityHint={!isDateValid ? messages.invalidDate : props.accessibilityHint}
				accessibilityState={{ disabled: isDisabled, busy: isBusy, required: props.isRequired && !props.isOptional, invalid: props.status?.type === 'error' || !isDateValid }}
			/>
			<textfield
				ref={(v: any) => { timeInput.current = v }}
				className={cx('vx-datetimeinput-input', 'vx-datetimeinput-timeinput', !isTimeValid && 'vx-datetimeinput-input--invalid')}
				value={timeDisplay}
				placeholder={props.timePlaceholder ?? 'Select a time'}
				isEnabled={!isDisabled && !isBusy}
				editable={!isDisabled && !isBusy}
				onTextChange={handleTimeChange}
				onBlur={commitTimePending}
				accessibilityHint={!isTimeValid ? messages.invalidTime : undefined}
				accessibilityLabel={timeLabelText}
				accessibilityState={{ disabled: isDisabled, invalid: !isTimeValid }}
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
			{props.hasClear && shown != null && !isDisabled && !isBusy
				? <Pressable className="vx-datetimeinput-clear" accessibilityLabel={`Clear ${props.fieldLabel ?? props.label ?? 'date and time'}`} onPress={clear}><label text="×" /></Pressable>
				: null}
			{statusText != null
				? <label className={cx('vx-field-icon', `vx-field-icon--${props.status!.type}`)} text={statusText} accessibilityLabel={props.statusVariant === 'tooltip' ? props.status?.message : undefined} />
				: null}
		</flexboxlayout>
		<Popover anchor={anchor} open={open === 'calendar'} onDismiss={() => setOpen(null)} placement="bottom" className="vx-datetimeinput-popover">
			<Calendar
				locale={props.locale}
				direction={props.direction}
				messages={props.messages}
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
		{timeOptions.length ? (
			<Popover anchor={anchor} open={open === 'times'} onDismiss={() => setOpen(null)} placement="bottom" className="vx-datetimeinput-times">
				<scrollview className="vx-datetimeinput-timelist" accessibilityHint={!isTimeValid ? messages.invalidTime : undefined}
				accessibilityLabel={timeLabelText}>
					<stacklayout>
						{timeOptions.map((opt) => (
							<flexboxlayout
								key={opt.time}
								className={cx('vx-datetimeinput-timeoption', opt.time === (timeDraft ?? valueParts.time) && 'vx-datetimeinput-timeoption--selected')}
								onTap={() => { commitTime(opt.time); setOpen(null) }}
							>
								<label text={opt.label} />
							</flexboxlayout>
						))}
					</stacklayout>
				</scrollview>
			</Popover>
		) : null}
	</>
}

/** Combined date+time entry — typed date segment with calendar popover plus
 *  typed time segment (and a preset-time list when `timeOptionInterval` is
 *  set). On macOS every presentation resolves to this pointer surface. */
export function DateTimeInput(props: DateTimeInputProps) @{
	const inField = useContext(FieldContext) != null
	const cid = useId()
	const control = <DateTimeInputControl {...props} />

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
