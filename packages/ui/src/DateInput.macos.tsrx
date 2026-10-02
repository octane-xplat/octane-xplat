/** @jsxImportSource @octane-xplat/macos-renderer */
import { useContext, useId, useMemo, useRef, useState } from 'octane'
import type { DateInputProps, ISODateString } from './props'
import { cx } from './cx'
import { Icon } from './Icon.macos.tsrx'
import { Pressable } from './Pressable.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'
import { Popover } from './Popover.macos.tsrx'
import { FieldContext, useFieldControlProps } from './field-context'
import { Calendar } from './Calendar.macos.tsrx'
import {
	formatDateValue,
	parseDateInput,
	plainDateToISO,
	resolveLocale,
} from './datetime'

import { createDateDisabledCheck } from './calendar-core'

const STATUS_TEXT = { error: '⚠', warning: '⚠', success: '✓' } as const

function DateInputControl(inputProps: DateInputProps) @{
	const props = useFieldControlProps(inputProps)
	const locale = resolveLocale()
	const generatedId = useId()
	const inputId = props.id ?? generatedId
	const anchor = useRef<any>(null)

	const [open, setOpen] = useState(false)
	const [pendingInput, setPendingInput] = useState<string | null>(null)
	const [busy, setBusy] = useState(false)
	const [draft, setDraft] = useState<ISODateString | null | undefined>(undefined)

	const value = props.value
	const shown: ISODateString | undefined = draft === undefined ? value : (draft ?? undefined)
	const isDisabled = !!props.isDisabled || !!props.isReadOnly
	const isBusy = !!props.isLoading || busy

	const isDateDisabled = useMemo(
		() => createDateDisabledCheck({ min: props.min, max: props.max, dateConstraints: props.dateConstraints }),
		[props.min, props.max, props.dateConstraints],
	)

	const formatValue = (iso: ISODateString): string => formatDateValue(iso, props.format ?? 'date_long', locale)

	const fireChange = (next: ISODateString | undefined) => {
		setDraft(next === undefined ? null : next)
		props.onChange?.(next)
		if (props.changeAction) {
			setBusy(true)
			Promise.resolve(props.changeAction(next)).finally(() => setBusy(false))
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
		if (pendingInput == null) return
		if (!pendingInput.trim()) {
			if (shown != null) fireChange(undefined)
		} else {
			commitParsed(parseDateInput(pendingInput, locale))
		}

		setPendingInput(null)
	}

	const handleTextChange = (text: string) => {
		if (isDisabled) return
		setPendingInput(text)
		commitParsed(parseDateInput(text, locale))
	}

	const pickFromCalendar = (iso: ISODateString) => {
		fireChange(iso)
		setPendingInput(null)
		setOpen(false)
	}

	const displayText = pendingInput ?? (shown ? formatValue(shown) : '')
	const statusText = props.status ? STATUS_TEXT[props.status.type] : null

	<>
		<flexboxlayout
			ref={(v: any) => { anchor.current = v }}
			flexDirection="row"
			alignItems="center"
			className={cx(
				'vx-dateinput',
				'vx-dateinput-popover',
				isDisabled && 'vx-dateinput--disabled',
				isBusy && 'vx-dateinput--loading',
				props.status && `vx-dateinput--status-${props.status.type}`,
				props.size && `vx-dateinput--size-${props.size}`,
				!isPendingValid && 'vx-dateinput--invalid',
				props.className,
			)}
			style={props.style}
		>
			<Pressable
				className="vx-dateinput-toggle"
				accessibilityLabel={open ? 'Close calendar' : 'Open calendar'}
				disabled={isDisabled || isBusy}
				onPress={() => { if (!isDisabled && !isBusy) setOpen(!open) }}
			>
				<Icon name="xplat-calendar" size={16} />
			</Pressable>
			<textfield
				id={inputId}
				className={cx('vx-dateinput-input', !isPendingValid && 'vx-dateinput-input--invalid')}
				value={displayText}
				placeholder={props.placeholder ?? 'Select a date'}
				isEnabled={!isDisabled && !isBusy}
				editable={!isDisabled && !isBusy}
				onTextChange={handleTextChange}
				onBlur={commitPending}
				accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
				accessibilityHint={props.accessibilityHint}
				accessibilityState={{ disabled: isDisabled, busy: isBusy, required: props.isRequired && !props.isOptional, invalid: props.status?.type === 'error' || !isPendingValid }}
			/>
			{props.hasClear && shown != null && !isDisabled && !isBusy
				? <Pressable className="vx-dateinput-clear" accessibilityLabel={`Clear ${props.fieldLabel ?? props.label ?? 'date'}`} onPress={() => { setPendingInput(null); fireChange(undefined) }}><label text="×" /></Pressable>
				: null}
			{statusText != null
				? <label className={cx('vx-field-icon', `vx-field-icon--${props.status!.type}`)} text={statusText} accessibilityLabel={props.statusVariant === 'tooltip' ? props.status?.message : undefined} />
				: null}
		</flexboxlayout>
		<Popover anchor={anchor} open={open} onDismiss={() => setOpen(false)} placement="bottom" className="vx-dateinput-popover">
			<Calendar
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
	</>
}

/** Date entry field — typed text + calendar popover. On macOS every
 *  presentation resolves to the pointer surface (fine pointer by
 *  definition); the OS-authentic picker is the `@octane-xplat/date-picker`
 *  AppKit leaf (`AppKitDatePicker`). */
export function DateInput(props: DateInputProps) @{
	const inField = useContext(FieldContext) != null
	const cid = useId()
	const control = <DateInputControl {...props} />

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
