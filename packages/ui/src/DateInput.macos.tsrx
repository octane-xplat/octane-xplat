/** @jsxImportSource @octane-xplat/jsx */
import { appKitTextChange } from './appkit-events.macos'
import { mergeStyle } from './style-merge'
import { createAppKitDateFieldHandle } from './date-field-handle.macos'
import { createAppKitAutoFocus } from './auto-focus.macos'
import { useImperativeHandle, useContext, useEffect, useLayoutEffect, useId, useMemo, useRef, useState, useCallback } from 'octane'
import type { DateInputProps, ISODateString } from './props'
import type { NSTextField, NSView } from '@octane-xplat/platform/macos'
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
import { formatDateValue, parseDateInput, plainDateFromISO, plainDateToISO, resolveLocale } from './datetime'

import { createDateDisabledCheck } from './calendar-core'

const STATUS_TEXT = { error: '⚠', warning: '⚠', success: '✓' } as const

function DateInputControl(inputProps: DateInputProps) @{
	const props = useFieldControlProps(inputProps)
	const locale = resolveLocale(props.locale)
	const messages = dateMessages(props.messages)
	const generatedId = useId()
	const inputId = props.id ?? generatedId
	const input = useRef<NSTextField | null>(null)
	const anchor = useRef<NSView | null>(null)
	const bindInput = useCallback((view: NSTextField | null) => { input.current = view; autoFocus.bind(view) }, [])
	const bindAnchor = useCallback((view: NSView | null) => { anchor.current = view; if (!view) openRef.current = false }, [])

	const [open, setOpenState] = useState(false)
	const openRef = useRef(open); openRef.current = open
	const writing = useRef(false), actionPending = useRef(false)
	const setOpen = (next: boolean) => { openRef.current = next; if (anchor.current) setOpenState(next) }
	const [pendingInput, setPendingInput] = useState<string | null>(null)
	const [busy, setBusy] = useState(false)

	const lastEmitted = useRef<ISODateString | null | undefined>(undefined)
	const value = props.value
	const shown = value
	const isDisabled = !!props.isDisabled || !!props.isReadOnly
	const isBusy = !!props.isLoading || busy
	const blocked = useRef(isDisabled || isBusy); blocked.current = isDisabled || isBusy
	useImperativeHandle(props.ref, () => createAppKitDateFieldHandle({
		primary: () => input.current, blocked: () => blocked.current || actionPending.current,
	}), [])

	const isDateDisabled = useMemo(
		() =>
			createDateDisabledCheck({
				min: props.min,
				max: props.max,
				dateConstraints: props.dateConstraints,
			}),
		[props.min, props.max, props.dateConstraints],
	)

	const current = useRef({ props, isDateDisabled })
	current.current = { props, isDateDisabled }
	const autoFocus = useMemo(() => createAppKitAutoFocus({
		requested: () => current.current.props.hasAutoFocus === true, blocked: () => blocked.current || actionPending.current,
	}), [])
	useLayoutEffect(() => autoFocus.update(), null)
	useEffect(() => () => autoFocus.dispose(), [])
	useEffect(() => { if (blocked.current && openRef.current) setOpen(false) }, [isDisabled, isBusy])

	const formatValue = (iso: ISODateString): string =>
		formatDateValue(iso, props.format ?? 'date_long', locale)

	// Preserve typing on an echoed edit; external values replace the draft.
	useEffect(() => {
		if (value !== lastEmitted.current) {
			setPendingInput(null)
		}

		lastEmitted.current = undefined
	}, [value])

	const fireChange = (next: ISODateString | null): boolean => {
		const live = current.current
		if (!anchor.current || blocked.current || writing.current || actionPending.current) return false
		writing.current = true
		try {
			if (next !== null) {
				const parsed = plainDateFromISO(next)
				if (!parsed || live.isDateDisabled(parsed)) return false
			}
			lastEmitted.current = next
			live.props.onChange?.(next)
			if (live.props.changeAction) {
				actionPending.current = true
				if (anchor.current) setBusy(true)
				runDateChangeAction(() => live.props.changeAction!(next), () => {
					actionPending.current = false
					if (anchor.current) setBusy(false)
				})
			}
			return true
		} finally { writing.current = false }
	}

	const pendingParsed =
		pendingInput != null && pendingInput.trim() ? parseDateInput(pendingInput, locale) : null

	const isPendingValid =
		pendingInput == null || !pendingInput.trim()
			? true
			: pendingParsed !== null && !isDateDisabled(pendingParsed)

	const commitParsed = (pd: ReturnType<typeof parseDateInput>) => {
		if (!pd) return false
		const iso = plainDateToISO(pd)
		return iso !== current.current.props.value && fireChange(iso)
	}

	const commitPending = () => {
		if (!anchor.current || blocked.current || writing.current || actionPending.current || hasDateComposition(input.current)) {
			return
		}

		if (pendingInput == null) {
			return
		}

		if (!pendingInput.trim()) {
			if (shown != null) {
				fireChange(null)
			}
		} else {
			commitParsed(parseDateInput(pendingInput, locale))
		}

		if (anchor.current) setPendingInput(null)
	}

	const handleTextChange = (text: string) => {
		if (!anchor.current || blocked.current || writing.current || actionPending.current) {
			return
		}

		setPendingInput(text)
		if (hasDateComposition(input.current)) {
			return
		}

		commitParsed(parseDateInput(text, locale))
	}

	const pickFromCalendar = (iso: ISODateString) => {
		if (!openRef.current || !fireChange(iso)) return
		if (anchor.current) { setPendingInput(null); setOpen(false) }
	}

	const displayText = pendingInput ?? (shown ? formatValue(shown) : '')
	const statusText = props.status ? STATUS_TEXT[props.status.type] : null

	<>
		<masonview
			ref={bindAnchor}
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
			style={mergeStyle(
				{ flexDirection: 'row', alignItems: 'center' },
				mergeStyle({ display: 'flex' }, props.style),
			)}
		>
			<Pressable
				className="vx-dateinput-toggle"
				accessibilityLabel={open ? messages.closeCalendar : messages.openCalendar}
				disabled={isDisabled || isBusy}
				onPress={() => {
					if (anchor.current && !blocked.current && !writing.current && !actionPending.current) {
						setOpen(!openRef.current)
					}
				}}
			>
				<Icon name="xplat-calendar" size={16} />
			</Pressable>
			<textfield
				ref={bindInput}
				id={inputId}
				className={cx('vx-dateinput-input', !isPendingValid && 'vx-dateinput-input--invalid')}
				value={displayText}
				placeholder={props.placeholder ?? 'Select a date'}
				isEnabled={!isDisabled && !isBusy}
				editable={!isDisabled && !isBusy}
				onTextChange={appKitTextChange(handleTextChange)}
				onBlur={commitPending}
				onSubmit={commitPending}
				accessibilityLabel={
					props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
				}
				accessibilityHint={!isPendingValid ? messages.invalidDate : props.accessibilityHint}
				accessibilityState={{
					disabled: isDisabled,
					busy: isBusy,
					required: props.isRequired && !props.isOptional,
					invalid: props.status?.type === 'error' || !isPendingValid,
				}}
			/>
			{props.hasClear && shown != null && !isDisabled && !isBusy ? (
				<Pressable
					className="vx-dateinput-clear"
					accessibilityLabel={`Clear ${props.fieldLabel ?? props.label ?? 'date'}`}
					onPress={() => {
						if (fireChange(null) && anchor.current) setPendingInput(null)
					}}
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
			open={open && !isDisabled && !isBusy}
			onDismiss={() => setOpen(false)}
			placement="bottom"
			className="vx-dateinput-popover"
		>
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
