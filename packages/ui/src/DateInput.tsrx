/** @jsxImportSource @nativescript-community/octane */
import { useImperativeHandle, useContext, useEffect, useId, useMemo, useRef, useState } from 'octane'
import type { DateInputProps, ISODateString } from './props'
import { cx } from './cx'
import { dateMessages } from './date-messages'
import { hasDateComposition } from './date-composition'
import { runDateChangeAction } from './date-field-action'
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
import {
	effectivePresentation,
	formatDateValue,
	parseDateInput,
	plainDateToISO,
	resolveInputSurface,
	resolveLocale,
} from './datetime'

import { createDateDisabledCheck } from './calendar-core'

const STATUS_TEXT = { error: '⚠', warning: '⚠', success: '✓' } as const

interface CoreProps extends DateInputProps {
	surface: 'popover' | 'sheet'
}

function DateInputControl(inputProps: CoreProps) @{
	const props = useFieldControlProps(inputProps)
	const surface = inputProps.surface
	const locale = resolveLocale(props.locale)
	const messages = dateMessages(props.messages)
	const generatedId = useId()
	const inputId = props.id ?? generatedId
	const anchor = useRef<any>(null)
	const input = useRef<any>(null)

	const [open, setOpen] = useState(false)
	const [pendingInput, setPendingInput] = useState<string | null>(null)
	const [busy, setBusy] = useState(false)

	const lastEmitted = useRef<ISODateString | undefined>(undefined)
	const value = props.value
	const shown = value
	const isDisabled = !!props.isDisabled || !!props.isReadOnly
	const isBusy = !!props.isLoading || busy

	const isDateDisabled = useMemo(
		() => createDateDisabledCheck({ min: props.min, max: props.max, dateConstraints: props.dateConstraints }),
		[props.min, props.max, props.dateConstraints],
	)

	const formatValue = (iso: ISODateString): string => formatDateValue(iso, props.format ?? 'date_long', locale)

	// Preserve typing on an echoed edit; external values replace the draft.
	useEffect(() => {
		if (value !== lastEmitted.current) {
			setPendingInput(null)
		}

		lastEmitted.current = undefined
	}, [value])

	const fireChange = (next: ISODateString | undefined) => {
		if (isDisabled || isBusy) return
		lastEmitted.current = next
		props.onChange?.(next)
		if (props.changeAction) {
			setBusy(true)
			runDateChangeAction(() => props.changeAction!(next), () => setBusy(false))
		}
	}

	const pendingParsed = pendingInput != null && pendingInput.trim() ? parseDateInput(pendingInput, locale) : null
	const isPendingValid = pendingInput == null || !pendingInput.trim() ? true : pendingParsed !== null && !isDateDisabled(pendingParsed)

	const commitParsed = (pd: ReturnType<typeof parseDateInput>) => {
		if (pd && !isDateDisabled(pd)) {
			const iso = plainDateToISO(pd)
			if (iso !== shown) fireChange(iso)
			return true
		}

		return false
	}

	const commitPending = () => {
		if (hasDateComposition(input.current)) return
		if (pendingInput == null) return
		if (!pendingInput.trim()) {
			if (shown != null) fireChange(undefined)
		} else {
			commitParsed(parseDateInput(pendingInput, locale))
		}

		setPendingInput(null)
		if (input.current) writeText(input.current, shown ? formatValue(shown as ISODateString) : '')
	}

	const handleTextChange = (e: any) => {
		if (isDisabled || isWritingText(e.object)) return
		const text = e.value as string
		setPendingInput(text)
		if (hasDateComposition(input.current, e)) return
		commitParsed(parseDateInput(text, locale))
	}

	const pickFromCalendar = (iso: ISODateString) => {
		fireChange(iso)
		setPendingInput(null)
		if (input.current) writeText(input.current, formatValue(iso))
		setOpen(false)
	}

	const clear = () => {
		setPendingInput(null)
		fireChange(undefined)
		if (input.current) writeText(input.current, '')
		input.current?.focus?.()
	}

	const displayText = pendingInput ?? (shown ? formatValue(shown) : '')
	const statusText = props.status ? STATUS_TEXT[props.status.type] : null

	// The textfield's text isn't a bound prop — imperative writes keep the
	// formatted display in step with `value` while typing owns the field.
	useEffect(() => {
		if (surface === 'popover' && input.current && pendingInput == null) {
			writeText(input.current, displayText)
		}
	}, [displayText])

	const shellContent = (
		<>
			<Pressable
				className="vx-dateinput-toggle"
				accessibilityLabel={open ? messages.closeCalendar : messages.openCalendar}
				disabled={isDisabled || isBusy}
				onPress={() => { if (!isDisabled && !isBusy) setOpen(!open) }}
			>
				<Icon name="xplat-calendar" size={16} />
			</Pressable>
			{surface === 'popover' ? (
				<textfield
					ref={(v: any) => { input.current = v; }}
					id={inputId}
					className={cx('vx-dateinput-input', !isPendingValid && 'vx-dateinput-input--invalid')}
					hint={props.placeholder ?? 'Select a date'}
					isEnabled={!isDisabled && !isBusy}
					editable={!isDisabled && !isBusy}
					accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
					accessibilityHint={!isPendingValid ? messages.invalidDate : props.accessibilityHint}
					accessibilityState={nativeAccessibilityState({ disabled: isDisabled, busy: isBusy, required: props.isRequired && !props.isOptional, invalid: props.status?.type === 'error' || !isPendingValid } as any) as any}
					onTextChange={handleTextChange}
					onBlur={commitPending}
					onReturnPress={commitPending}
					autocorrect={false}
				/>
			) : (
				<Pressable
					className={cx('vx-dateinput-input', 'vx-dateinput-segment', !shown && 'vx-dateinput-segment--placeholder')}
					disabled={isDisabled || isBusy}
					accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
					accessibilityHint={!isPendingValid ? messages.invalidDate : props.accessibilityHint}
					accessibilityState={{ disabled: isDisabled }}
					onPress={() => { if (!isDisabled && !isBusy) setOpen(true) }}
				>
					<label text={shown ? formatValue(shown) : (props.placeholder ?? 'Select a date')} />
				</Pressable>
			)}
			{props.hasClear && shown != null && !isDisabled && !isBusy
				? <Pressable className="vx-dateinput-clear" accessibilityLabel={`Clear ${props.fieldLabel ?? props.label ?? 'date'}`} onPress={clear}><label text="×" /></Pressable>
				: null}
			{statusText != null && props.statusVariant !== 'tooltip'
				? <label className={cx('vx-field-icon', `vx-field-icon--${props.status!.type}`)} text={statusText} />
				: null}
			{statusText != null && props.statusVariant === 'tooltip'
				? <label className={cx('vx-field-icon', `vx-field-icon--${props.status!.type}`)} text={statusText} accessibilityLabel={props.status?.message} />
				: null}
		</>
	)

	useImperativeHandle(props.ref, () => ({ focus: () => input.current.focus(), blur: () => blurText(input.current), native: input.current }), undefined);

	<>
		<flexboxlayout
			ref={(v: any) => { anchor.current = v }}
			flexDirection="row"
			alignItems="center"
			className={cx(
				'vx-dateinput',
				`vx-dateinput--${surface}`,
				isDisabled && 'vx-dateinput--disabled',
				isBusy && 'vx-dateinput--loading',
				props.status && `vx-dateinput--status-${props.status.type}`,
				props.size && `vx-dateinput--size-${props.size}`,
				(!isPendingValid) && 'vx-dateinput--invalid',
				props.className,
			)}
			style={props.style}
		>
			{shellContent}
		</flexboxlayout>
		{surface === 'popover' ? (
			<Popover anchor={anchor} open={open} onDismiss={() => setOpen(false)} placement="bottom" className="vx-dateinput-popover">
				<Calendar
					locale={props.locale}
					direction={props.direction}
					messages={props.messages}
					mode="single"
					value={typeof shown === 'string' ? shown : undefined}
					onChange={pickFromCalendar}
					min={props.min}
					max={props.max}
					dateConstraints={props.dateConstraints}
					numberOfMonths={props.numberOfMonths}
					weekStartsOn={props.weekStartsOn}
				/>
			</Popover>
		) : (
			<BottomSheet isOpen={open} onOpenChange={(isOpen) => setOpen(isOpen)} label={props.label ?? props.accessibilityLabel ?? 'Choose a date'} height="hug" className="vx-dateinput-sheet">
				<Calendar
					locale={props.locale}
					direction={props.direction}
					messages={props.messages}
					mode="single"
					value={typeof shown === 'string' ? shown : undefined}
					onChange={pickFromCalendar}
					min={props.min}
					max={props.max}
					dateConstraints={props.dateConstraints}
					numberOfMonths={1}
					weekStartsOn={props.weekStartsOn}
				/>
			</BottomSheet>
		)}
	</>
}

/**
 * Date entry field — ISO `value`, typed text + calendar popover, or the
 * self-drawn bottom sheet for touch presentations. On iOS/Android the
 * `native`/`adaptive-native` surfaces resolve to `bottom-sheet`: the
 * OS-authentic pickers are `@octane-xplat/date-picker`'s platform leaves,
 * not part of the shared control.
 */
export function DateInput(props: DateInputProps) @{
	const inField = useContext(FieldContext) != null
	const effective = effectivePresentation(props.presentation, props.nativePicker, 'date')
	const resolved = resolveInputSurface(effective, true)
	const surface: 'popover' | 'sheet' = resolved === 'popover' || resolved === 'typed' ? 'popover' : 'sheet'
	const cid = useId()

	const control = <DateInputControl {...props} surface={surface} />

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
