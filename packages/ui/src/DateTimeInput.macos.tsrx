/** @jsxImportSource @octane-xplat/jsx */
import { appKitTextChange } from './appkit-events.macos'
import { mergeStyle } from './style-merge'
import { createAppKitDateFieldHandle } from './date-field-handle.macos'
import { useImperativeHandle, useContext, useEffect, useId, useMemo, useRef, useState, useCallback } from 'octane'
import type { DateTimeInputProps, ISODateString, ISODateTimeString, ISOTimeString } from './props'
import { cx } from '@octane-xplat/lib'
import { dateMessages } from './date-messages'
import { hasDateComposition } from './date-composition'
import { runDateChangeAction } from './date-field-action'
import { Icon } from './Icon.macos.tsrx'
import { Pressable } from './Pressable.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'
import { Popover } from './Popover.macos.tsrx'
import { FieldContext, useFieldControlProps } from './field-context'
import { Calendar } from './Calendar.macos.tsrx'
import { AppKitPresetTimeList } from './PresetTimeList.macos.tsrx'
import { createAppKitMenuReturn } from './menu-return.macos'
import type { NativeKeyboardEvent } from '@octane-xplat/jsx/intrinsics'
import type { NSTextField, NSView } from '@octane-xplat/platform/macos'
import {
	adjustTime,
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
	plainDateFromISO,
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
	const dateInput = useRef<NSTextField | null>(null)
	const timeInput = useRef<NSTextField | null>(null)
	const anchor = useRef<NSView | null>(null)
	const writing = useRef(false), actionPending = useRef(false), editing = useRef(false)

	const [open, setOpenState] = useState<'calendar' | 'times' | null>(null)
	const openRef = useRef(open); openRef.current = open
	const setOpen = (next: 'calendar' | 'times' | null) => { openRef.current = next; if (anchor.current) setOpenState(next) }
	const bindAnchor = useCallback((view: NSView | null) => { anchor.current = view; if (!view) openRef.current = null }, [])
	const bindDate = useCallback((view: NSTextField | null) => { dateInput.current = view }, [])
	const bindTime = useCallback((view: NSTextField | null) => { timeInput.current = view }, [])
	const [datePending, setDatePendingState] = useState<string | null>(null)
	const [timePending, setTimePendingState] = useState<string | null>(null)
	const dateDraft = useRef<{ text: string | null }>({ text: null }), timeTextDraft = useRef<{ text: string | null }>({ text: null })
	const setDatePending = (text: string | null) => { dateDraft.current = { text }; if (dateInput.current) setDatePendingState(text) }
	const setTimePending = (text: string | null) => { timeTextDraft.current = { text }; if (timeInput.current) setTimePendingState(text) }
	const [busy, setBusy] = useState(false)
	const [timeDraft, setTimeDraftState] = useState<ISOTimeString | undefined>(undefined)
	const localTime = useRef<{ value: ISOTimeString | undefined }>({ value: undefined })
	const setTimeDraft = (value: ISOTimeString | undefined) => { localTime.current = { value }; if (anchor.current) setTimeDraftState(value) }

	const lastEmitted = useRef<ISODateTimeString | null | undefined>(undefined)
	const value = props.value
	const shown = value
	const isDisabled = !!props.isDisabled || !!props.isReadOnly
	const isBusy = !!props.isLoading || busy
	const hasSeconds = !!props.hasSeconds
	const current = useRef({ props, isDisabled, isBusy })
	current.current = { props, isDisabled, isBusy }
	const canEdit = () => !!anchor.current && !current.current.isDisabled && !current.current.isBusy && !writing.current && !actionPending.current
	const editDraft = (field: { current: NSTextField | null }, action: () => void) => {
		if (!field.current || !canEdit() || editing.current) return
		editing.current = true
		try { action() } finally { editing.current = false }
	}
	useImperativeHandle(props.ref, () => createAppKitDateFieldHandle({
		primary: () => dateInput.current, fields: () => [dateInput.current, timeInput.current],
		blocked: () => current.current.isDisabled || current.current.isBusy || actionPending.current,
	}), [])
	const formatDisplay = (time: ISOTimeString, seconds: boolean) =>
		props.locale
			? formatLocalizedTime(time, seconds, props.hourFormat ?? '12h', resolveLocale(props.locale))
			: (props.hourFormat === '24h' ? formatDisplayTime24h : formatDisplayTime12h)(time, seconds)

	const minParts = useMemo(() => splitDateTime(props.min), [props.min])
	const maxParts = useMemo(() => splitDateTime(props.max), [props.max])
	const valueParts = useMemo(() => splitDateTime(shown), [shown])

	const isDateDisabled = useMemo(
		() =>
			createDateDisabledCheck({
				min: minParts.date,
				max: maxParts.date,
				dateConstraints: props.dateConstraints,
			}),
		[minParts.date, maxParts.date, props.dateConstraints],
	)

	const timeMin =
		minParts.date && minParts.time && valueParts.date === minParts.date ? minParts.time : undefined

	const timeMax =
		maxParts.date && maxParts.time && valueParts.date === maxParts.date ? maxParts.time : undefined

	const values = useRef({ props, locale, hasSeconds, minParts, maxParts, valueParts, isDateDisabled, timeMin, timeMax })
	values.current = { props, locale, hasSeconds, minParts, maxParts, valueParts, isDateDisabled, timeMin, timeMax }

	// Preserve typing on an echoed edit; external values replace the draft.
	useEffect(() => {
		if (value !== lastEmitted.current) {
			setDatePending(null)
			setTimePending(null)
			setTimeDraft(undefined)
		}

		lastEmitted.current = undefined
	}, [value])

	const fireChange = (next: ISODateTimeString | null | undefined): boolean => {
		const live = current.current
		if (!canEdit()) return false
		const emitted = next ?? null
		if (emitted === (live.props.value ?? null)) return true
		writing.current = true
		try {
			const change = live.props.onChange, action = live.props.changeAction
			lastEmitted.current = emitted
			change?.(emitted)
			if (action) {
				actionPending.current = true
				if (anchor.current) setBusy(true)
				runDateChangeAction(() => action(emitted), () => {
					actionPending.current = false
					if (anchor.current) setBusy(false)
				})
			}
			return true
		} finally { writing.current = false }
	}

	const commitDate = (iso: ISODateString, fromPicker: boolean): boolean => {
		if (!dateInput.current || !canEdit() || (fromPicker && (editing.current || openRef.current !== 'calendar'))) return false
		const ownClaim = !editing.current
		if (ownClaim) editing.current = true
		try {
			const live = values.current, parsed = plainDateFromISO(iso)
			const metadata = { value: live.props.value, min: live.props.min, max: live.props.max, constraints: live.props.dateConstraints, seconds: live.props.hasSeconds, locale: live.props.locale }
			if (!parsed || live.isDateDisabled(parsed) || !canEdit()) return false
			// Constraints may call application code; reject metadata replaced there.
			const next = current.current.props
			if (next.value !== metadata.value || next.min !== metadata.min || next.max !== metadata.max || next.dateConstraints !== metadata.constraints || next.hasSeconds !== metadata.seconds || next.locale !== metadata.locale) return false
			const host = anchor.current, dateHost = dateInput.current, ownedLocalTime = localTime.current, ownedDate = dateDraft.current
			let time = live.valueParts.time ?? ownedLocalTime.value ?? currentISOTime(live.hasSeconds)
			if (live.minParts.date === iso && live.minParts.time && !isTimeInRange(time, live.minParts.time, undefined)) time = live.minParts.time
			if (live.maxParts.date === iso && live.maxParts.time && !isTimeInRange(time, undefined, live.maxParts.time)) time = live.maxParts.time
			const accepted = fireChange(combineDateTime(iso, time))
			if (accepted && host && anchor.current === host) {
				if (localTime.current === ownedLocalTime) setTimeDraft(undefined)
				if (fromPicker) { if (dateInput.current === dateHost && dateDraft.current === ownedDate) setDatePending(null); if (openRef.current === 'calendar') setOpen(null) }
			}
			return accepted
		} finally { if (ownClaim) editing.current = false }
	}

	const commitTime = (time: ISOTimeString | undefined): boolean => {
		if (!timeInput.current || !canEdit()) return false
		const live = values.current, host = anchor.current, ownedLocalTime = localTime.current
		if (time === undefined) {
			const accepted = live.props.value != null ? fireChange(null) : true
			if (accepted && host && anchor.current === host && localTime.current === ownedLocalTime) setTimeDraft(undefined)
			return accepted
		}
		if (!isTimeInRange(time, live.timeMin, live.timeMax)) return false
		if (live.valueParts.date) return fireChange(combineDateTime(live.valueParts.date, time))
		setTimeDraft(time)
		return true
	}

	const dateParsed =
		datePending != null && datePending.trim() ? parseDateInput(datePending, locale) : null

	const isDateValid =
		datePending == null || !datePending.trim()
			? true
			: dateParsed !== null && !isDateDisabled(dateParsed)

	const dateDisplay =
		datePending ?? (valueParts.date ? formatDateValue(valueParts.date, 'date_long', locale) : '')

	const handleDateChange = (text: string) => editDraft(dateInput, () => {
		setDatePending(text)
		if (hasDateComposition(dateInput.current)) return
		const parsed = parseDateInput(text, values.current.locale)
		if (parsed) commitDate(plainDateToISO(parsed), false)
	})

	const commitDatePending = () => editDraft(dateInput, () => {
		if (hasDateComposition(dateInput.current)) return
		const owned = dateDraft.current, field = dateInput.current, host = anchor.current
		if (owned.text == null) return
		let accepted = false
		if (!owned.text.trim()) accepted = current.current.props.value != null ? fireChange(null) : true
		else { const parsed = parseDateInput(owned.text, values.current.locale); if (parsed) accepted = commitDate(plainDateToISO(parsed), false) }
		if (field && dateInput.current === field && anchor.current === host && dateDraft.current === owned && (accepted || canEdit())) setDatePending(null)
	})

	const timeParsed =
		timePending != null && timePending.trim() ? parseTimeInput(timePending, hasSeconds) : null

	const isTimeValid =
		timePending == null || !timePending.trim()
			? true
			: timeParsed !== null && isTimeInRange(timeParsed, timeMin, timeMax)

	const timeDisplay =
		timePending ??
		((timeDraft ?? valueParts.time)
			? formatDisplay((timeDraft ?? valueParts.time)!, hasSeconds)
			: '')

	const handleTimeChange = (text: string) => editDraft(timeInput, () => {
		setTimePending(text)
		if (hasDateComposition(timeInput.current)) return
		const parsed = parseTimeInput(text, values.current.hasSeconds)
		if (parsed) commitTime(parsed)
	})

	const commitTimePending = () => editDraft(timeInput, () => {
		if (hasDateComposition(timeInput.current)) return
		const owned = timeTextDraft.current, field = timeInput.current, host = anchor.current
		if (owned.text == null) return
		let accepted = false
		if (!owned.text.trim()) accepted = commitTime(undefined)
		else { const parsed = parseTimeInput(owned.text, values.current.hasSeconds); if (parsed) accepted = commitTime(parsed) }
		if (field && timeInput.current === field && anchor.current === host && timeTextDraft.current === owned && (accepted || canEdit())) setTimePending(null)
	})

	const timeOptions = useMemo(() => {
		if (!props.timeOptionInterval) {
			return []
		}

		const list: { time: ISOTimeString; label: string }[] = []
		for (let m = 0; m < MINUTES_PER_DAY; m += props.timeOptionInterval) {
			const t = formatISOTime({ hour: Math.floor(m / 60), minute: m % 60, second: 0 }, hasSeconds)
			if (!isTimeInRange(t, timeMin, timeMax)) {
				continue
			}

			list.push({ time: t, label: formatDisplay(t, hasSeconds) })
		}

		return list
	}, [props.timeOptionInterval, hasSeconds, timeMin, timeMax, props.hourFormat, props.locale])

	const choosingTime = useRef(false)
	const timeState = useRef({ blocked: isDisabled || isBusy, options: timeOptions, commitTime,
		base: timeDraft ?? valueParts.time, hasSeconds, increment: props.timeIncrement ?? 1, min: timeMin, max: timeMax })
	timeState.current = { blocked: isDisabled || isBusy, options: timeOptions, commitTime,
		base: timeDraft ?? valueParts.time, hasSeconds, increment: props.timeIncrement ?? 1, min: timeMin, max: timeMax }
	const timeReturn = useMemo(() => createAppKitMenuReturn({ anchor: () => timeInput.current,
		open: () => openRef.current === 'times', close: () => setOpen(null),
	}), [])
	const finalTimeFocus = useMemo(() => ({ get current() { return timeReturn.focusTarget() } }), [])
	const closeTimes = () => { timeReturn.reset(); setOpen(null) }
	const chooseTime = (time: ISOTimeString) => {
		const current = timeState.current
		if (!anchor.current || editing.current || writing.current || actionPending.current || choosingTime.current || openRef.current !== 'times' || current.blocked || !current.options.some((option) => option.time === time)) return
		choosingTime.current = true
		openRef.current = null // Claim before application callbacks can reenter or flush parent state.
		timeReturn.reset()
		const host = anchor.current, field = timeInput.current, owned = timeTextDraft.current
		let accepted = false
		try { accepted = current.commitTime(time) }
		finally {
			try { if (host && anchor.current === host) { if (accepted && timeInput.current === field && timeTextDraft.current === owned) setTimePending(null); if (openRef.current === null) setOpen(null) } }
			finally { choosingTime.current = false }
		}
	}
	const leaveTimes = (backward: boolean) => {
		const target = timeReturn.resolveTab(backward)
		if (target) { timeReturn.requestTab(target); return true }
		closeTimes(); return false
	}
	const timeKeyDown = (event: NativeKeyboardEvent<NSView>) => {
		const live = timeState.current
		if (!timeInput.current || event.target !== timeInput.current || !anchor.current || editing.current || writing.current || actionPending.current || choosingTime.current || live.blocked ||
			event.defaultPrevented || event.isComposing || hasDateComposition(timeInput.current) || event.ctrlKey || event.metaKey || event.shiftKey) return
		if (event.altKey) {
			if (event.key === 'ArrowDown' && live.options.length) {
				event.preventDefault(); event.stopPropagation(); timeReturn.reset(); setOpen('times')
			}
			return
		}
		if (openRef.current !== null || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return
		event.preventDefault(); event.stopPropagation()
		const base = localTime.current.value ?? values.current.valueParts.time ?? currentISOTime(live.hasSeconds)
		const next = adjustTime(base, event.key === 'ArrowUp' ? live.increment : -live.increment, live.hasSeconds)
		if (next !== base && isTimeInRange(next, live.min, live.max)) {
			const host = anchor.current, field = timeInput.current, owned = timeTextDraft.current
			if (live.commitTime(next) && host && anchor.current === host && timeInput.current === field && timeTextDraft.current === owned) setTimePending(null)
		}
	}

	useEffect(() => {
		if ((isDisabled || isBusy) && openRef.current !== null) { timeReturn.reset(); setOpen(null) }
		else if (!timeOptions.length && openRef.current === 'times') closeTimes()
	}, [isDisabled, isBusy, timeOptions.length])

	const clear = () => editDraft(dateInput, () => {
		if (current.current.props.value == null) return
		const host = anchor.current, dateField = dateInput.current, timeField = timeInput.current, date = dateDraft.current, time = timeTextDraft.current, local = localTime.current
		if (!fireChange(null) || !host || anchor.current !== host) return
		if (dateInput.current === dateField && dateDraft.current === date) setDatePending(null)
		if (timeInput.current === timeField && timeTextDraft.current === time) setTimePending(null)
		if (localTime.current === local) setTimeDraft(undefined)
		timeReturn.reset(); setOpen(null)
	})

	const statusText = props.status ? STATUS_TEXT[props.status.type] : null

	<>
		<masonview
			ref={bindAnchor}
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
			style={mergeStyle(
				{ flexDirection: 'row', alignItems: 'center' },
				mergeStyle({ display: 'flex' }, props.style),
			)}
		>
			<Pressable
				className="vx-datetimeinput-calendartoggle"
				accessibilityLabel={open === 'calendar' ? messages.closeCalendar : messages.openCalendar}
				disabled={isDisabled || isBusy}
				onPress={() => {
					if (anchor.current && !editing.current && !writing.current && !actionPending.current && !choosingTime.current && !timeState.current.blocked) {
						timeReturn.reset(); setOpen(openRef.current === 'calendar' ? null : 'calendar')
					}
				}}
			>
				<Icon name="xplat-calendar" size={14} />
			</Pressable>
			<textfield
				ref={bindDate}
				id={dateId}
				className={cx(
					'vx-datetimeinput-input',
					'vx-datetimeinput-dateinput',
					!isDateValid && 'vx-datetimeinput-input--invalid',
				)}
				value={dateDisplay}
				placeholder={props.placeholder ?? 'Select a date'}
				isEnabled={!isDisabled && !isBusy}
				editable={!isDisabled && !isBusy}
				onTextChange={appKitTextChange(handleDateChange)}
				onBlur={commitDatePending}
				onSubmit={commitDatePending}
				accessibilityLabel={
					props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
				}
				accessibilityHint={!isDateValid ? messages.invalidDate : props.accessibilityHint}
				accessibilityState={{
					disabled: isDisabled,
					busy: isBusy,
					required: props.isRequired && !props.isOptional,
					invalid: props.status?.type === 'error' || !isDateValid,
				}}
			/>
			<textfield
				ref={bindTime}
				id={`${dateId}-time`}
				onKeyDown={timeKeyDown}
				className={cx(
					'vx-datetimeinput-input',
					'vx-datetimeinput-timeinput',
					!isTimeValid && 'vx-datetimeinput-input--invalid',
				)}
				value={timeDisplay}
				placeholder={props.timePlaceholder ?? 'Select a time'}
				isEnabled={!isDisabled && !isBusy}
				editable={!isDisabled && !isBusy}
				onTextChange={appKitTextChange(handleTimeChange)}
				onBlur={commitTimePending}
				onSubmit={commitTimePending}
				accessibilityHint={!isTimeValid ? messages.invalidTime : undefined}
				accessibilityLabel={timeLabelText}
				accessibilityState={{ disabled: isDisabled, invalid: !isTimeValid }}
			/>
			{timeOptions.length ? (
				<Pressable
					className="vx-datetimeinput-timestoggle"
					accessibilityLabel="Show preset times"
					disabled={isDisabled || isBusy}
					onPress={() => {
						if (anchor.current && !editing.current && !writing.current && !actionPending.current && !choosingTime.current && !timeState.current.blocked && timeState.current.options.length) {
							timeReturn.reset(); setOpen(openRef.current === 'times' ? null : 'times')
						}
					}}
				>
					<Icon name="xplat-clock" size={14} />
				</Pressable>
			) : null}
			{props.hasClear && shown != null && !isDisabled && !isBusy ? (
				<Pressable
					className="vx-datetimeinput-clear"
					accessibilityLabel={`Clear ${props.fieldLabel ?? props.label ?? 'date and time'}`}
					onPress={clear}
				>
					<label text="×" />
				</Pressable>
			) : null}
			{statusText != null ? (
				<label
					className={cx('vx-field-icon', `vx-field-icon--${props.status!.type}`)}
					text={statusText}
					accessibilityLabel={props.statusVariant === 'tooltip' ? props.status?.message : undefined}
				/>
			) : null}
		</masonview>
		<Popover
			anchor={anchor}
			open={open === 'calendar' && !isDisabled && !isBusy}
			onDismiss={() => setOpen(null)}
			placement="bottom"
			className="vx-datetimeinput-popover"
		>
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
			<Popover
				anchor={anchor}
				open={open === 'times' && !isDisabled && !isBusy}
				onDismiss={closeTimes}
				finalFocusRef={finalTimeFocus}
				placement="bottom"
				className="vx-datetimeinput-times"
			>
				<AppKitPresetTimeList options={timeOptions} seed={(timePending ? parseTimeInput(timePending, hasSeconds) : null) ?? timeDraft ?? valueParts.time}
					selected={timeDraft ?? valueParts.time} blocked={isDisabled || isBusy} label={timeLabelText}
					hint={!isTimeValid ? messages.invalidTime : undefined} choose={chooseTime} tab={leaveTimes} />
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
		{inField ? (
			control
		) : (
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
