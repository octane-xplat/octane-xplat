import { useImperativeHandle, useContext, useEffect, useId, useMemo, useRef, useState } from 'octane'
import type { DateInputProps, ISODateString } from './props'
import { cx } from './cx'
import { runDateChangeAction } from './date-field-action'
import { Icon } from './Icon.web.tsrx'
import { FormField } from './FormField.web.tsrx'
import { Popover } from './Popover.web.tsrx'
import { BottomSheet } from './BottomSheet.web.tsrx'
import { Tooltip } from './Tooltip.web.tsrx'
import { ActivityIndicator } from './ActivityIndicator.web.tsrx'
import { FieldContext, useFieldControlProps } from './field-context'
import { Calendar } from './Calendar.web.tsrx'
import {
	DATE_FORMAT_LONG,
	effectivePresentation,
	formatDateValue,
	isLocaleDayFirst,
	parseDateInput,
	plainDateFormat,
	plainDateFromISO,
	plainDateToISO,
	resolveInputSurface,
	resolveLocale,
	type PlainDate,
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

interface StatusGlyphProps {
	status?: { type: 'warning' | 'error' | 'success'; message?: string }
	variant?: string
}

function StatusGlyph(props: StatusGlyphProps) @{
	if (!props.status) return null
	const glyph = STATUS_GLYPHS[props.status.type]
	const span = <span className={cx('vx-field-icon', `vx-field-icon--${props.status.type}`)}>{glyph}</span>
	if (props.variant === 'tooltip' && props.status.message) {
		return <Tooltip trigger={span} content={props.status.message} />
	}

	return span
}

interface CoreProps extends DateInputProps {
	surface: 'popover' | 'sheet' | 'native'
}

function DateInputControl(inputProps: CoreProps) @{
	const props = useFieldControlProps(inputProps)
	const surface = inputProps.surface
	const locale = resolveLocale()
	const generatedId = useId()
	const inputId = props.id ?? generatedId
	const anchor = useRef<any>(null)
	const input = useRef<HTMLInputElement | null>(null)
	const shell = useRef<HTMLDivElement | null>(null)

	const [open, setOpen] = useState(false)
	const [pendingInput, setPendingInput] = useState<string | null>(null)
	const [isFocused, setIsFocused] = useState(false)
	const [busy, setBusy] = useState(false)
	const [rejected, setRejected] = useState<string | null>(null)

	const lastEmitted = useRef<ISODateString | undefined>(undefined)
	const value = props.value
	const shown = value
	const isDisabled = !!props.isDisabled || !!props.isReadOnly
	const isBusy = !!props.isLoading || busy
	const canClear = !!props.hasClear && shown != null && !isDisabled && !isBusy
	const showsDisabledReason = isDisabled && !!props.disabledMessage
	// Dedupe for the native surface — iOS fires both `input` and `change`.
	const lastCommit = useRef<string | null>(null)

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

	const parsedPending = pendingInput != null && pendingInput.trim() ? parseDateInput(pendingInput, locale) : null
	const isPendingValid = pendingInput == null || !pendingInput.trim() ? true : parsedPending !== null && !isDateDisabled(parsedPending)

	const commitParsed = (pd: PlainDate | null) => {
		if (pd && !isDateDisabled(pd)) {
			const iso = plainDateToISO(pd)
			if (iso !== shown) fireChange(iso)
			return true
		}

		return false
	}

	const handleType = (e: any) => {
		if (isDisabled) return
		const text = e.target.value as string
		setPendingInput(text)
		const parsed = parseDateInput(text, locale)
		if (parsed) commitParsed(parsed)
	}

	const handleBlur = () => {
		setIsFocused(false)
		if (pendingInput == null) return
		if (!pendingInput.trim()) {
			if (shown !== undefined && shown !== null) fireChange(undefined)
		} else {
			commitParsed(parseDateInput(pendingInput, locale))
		}

		setPendingInput(null)
		setRejected(null)
	}

	const handleKeyDown = (e: any) => {
		if (e.isComposing || e.keyCode === 229) return
		if (e.key === 'ArrowDown' && surface === 'popover' && !isDisabled) {
			e.preventDefault()
			setOpen(true)
		} else if (e.key === 'Escape' && open) {
			e.preventDefault()
			setOpen(false)
		} else if (e.key === 'Enter' && !e.shiftKey) {
			if (pendingInput != null) {
				if (pendingInput.trim()) commitParsed(parseDateInput(pendingInput, locale))
				else fireChange(undefined)

				setPendingInput(null)
			}
		}
	}

	const displayValue = pendingInput ?? (shown ? formatValue(shown) : '')
	const displayPlaceholder = isFocused && !displayValue
		? (isLocaleDayFirst(locale) ? 'e.g., 25/3/2026' : 'e.g., 3/25/2026')
		: (props.placeholder ?? 'Select a date')

	const pickFromCalendar = (iso: ISODateString) => {
		fireChange(iso)
		setPendingInput(null)
		setOpen(false)
	}

	const clear = (e?: any) => {
		e?.stopPropagation?.()
		setPendingInput(null)
		setRejected(null)
		fireChange(undefined)
		if (surface !== 'native') input.current?.focus({ preventScroll: true })
	}

	// --- native surface (<input type=date>) --------------------------------
	const openNativePicker = () => {
		if (isDisabled) return
		input.current?.focus?.()
		try { (input.current as any)?.showPicker?.() } catch {}
	}

	const handleNativeCommit = (e: any) => {
		const raw = (e.target.value ?? '') as string
		if (lastCommit.current === raw) return
		lastCommit.current = raw
		if (!raw) { setRejected(null); if (value !== undefined) fireChange(undefined); return }
		const parsed = parseDateInput(raw, locale)
		if (!parsed || isDateDisabled(parsed)) { setRejected(raw); return }
		setRejected(null)
		const iso = plainDateToISO(parsed)
		if (iso !== value) fireChange(iso)
	}

	// --- sheet surface (touch-style read display) ---------------------------
	const openSheet = () => { if (!isDisabled) setOpen(true) }

	const iconButton = (
		<button
			type="button"
			className="vx-dateinput-toggle"
			aria-label={open ? 'Close calendar' : 'Open calendar'}
			aria-expanded={surface !== 'native' ? open : undefined}
			disabled={isDisabled || isBusy || undefined}
			tabIndex={-1}
			onClick={() => {
				if (surface === 'native') openNativePicker()
				else if (surface === 'sheet') openSheet()
				else setOpen(!open)
			}}
		>
			<Icon name="xplat-calendar" size={16} />
		</button>
	)

	const shellNode = (
		<div
			ref={(el: any) => { shell.current = el; anchor.current = el }}
			className={cx(
				'vx-dateinput',
				`vx-dateinput--${surface}`,
				isDisabled && 'vx-dateinput--disabled',
				isBusy && 'vx-dateinput--loading',
				props.status && `vx-dateinput--status-${props.status.type}`,
				props.size && `vx-dateinput--size-${props.size}`,
				!isPendingValid && 'vx-dateinput--invalid',
				rejected !== null && 'vx-dateinput--invalid',
				props.className,
			)}
			style={props.style}
		>
			{iconButton}
			{surface === 'native' ? (
				<span className="vx-dateinput-nativeslot">
					<input
						ref={(el: any) => { input.current = el; }}
						id={inputId}
						type="date"
						className={cx('vx-dateinput-nativeinput', 'vx-dateinput-input')}
						value={shown && /^\d{4}-\d{2}-\d{2}$/.test(shown) ? shown : ''}
						min={props.min}
						max={props.max}
						disabled={isDisabled && !showsDisabledReason || undefined}
						aria-disabled={showsDisabledReason || undefined}
						readOnly={showsDisabledReason || undefined}
						autoFocus={props.hasAutoFocus || undefined}
						aria-label={props.ariaLabel}
						aria-labelledby={props.ariaLabelledBy}
						aria-describedby={props.ariaDescribedBy}
						aria-required={props.isRequired && !props.isOptional || undefined}
						aria-invalid={props.status?.type === 'error' || rejected !== null || undefined}
						aria-busy={isBusy || undefined}
						onChange={handleNativeCommit}
						onInput={handleNativeCommit}
						onFocus={() => setIsFocused(true)}
						onBlur={() => { setIsFocused(false); setRejected(null) }}
					/>
					<span className="vx-dateinput-overlay" aria-hidden="true">
						{shown ? formatValue(shown) : <span className="vx-dateinput-overlay--placeholder">{props.placeholder ?? 'Select a date'}</span>}
					</span>
				</span>
			) : surface === 'sheet' ? (
				<button
					type="button"
					className={cx('vx-dateinput-input', 'vx-dateinput-segment', !shown && 'vx-dateinput-segment--placeholder')}
					disabled={isDisabled || isBusy || undefined}
					aria-label={props.ariaLabel}
					aria-labelledby={props.ariaLabelledBy}
					aria-describedby={props.ariaDescribedBy}
					aria-required={props.isRequired && !props.isOptional || undefined}
					aria-expanded={open}
					aria-haspopup="dialog"
					onClick={openSheet}
				>
					{shown ? formatValue(shown) : (props.placeholder ?? 'Select a date')}
				</button>
			) : (
				<input
					ref={(el: any) => { input.current = el; }}
					id={inputId}
					type="text"
					role="combobox"
					className={cx('vx-dateinput-input', !isPendingValid && 'vx-dateinput-input--invalid')}
					value={displayValue}
					placeholder={displayPlaceholder}
					disabled={isDisabled && !showsDisabledReason || undefined}
					aria-disabled={showsDisabledReason || undefined}
					readOnly={showsDisabledReason || isBusy || undefined}
					autoFocus={props.hasAutoFocus || undefined}
					aria-label={props.ariaLabel}
					aria-labelledby={props.ariaLabelledBy}
					aria-describedby={props.ariaDescribedBy}
					aria-required={props.isRequired && !props.isOptional || undefined}
					aria-invalid={props.status?.type === 'error' || !isPendingValid || undefined}
					aria-busy={isBusy || undefined}
					aria-expanded={surface === 'popover' ? open : undefined}
					aria-haspopup={surface === 'popover' ? 'dialog' : undefined}
					onInput={handleType}
					onMouseDown={() => { if (surface === 'popover' && !isDisabled && !open) setOpen(true) }}
					onFocus={() => { if (!isDisabled) setIsFocused(true) }}
					onBlur={handleBlur}
					onKeyDown={handleKeyDown}
				/>
			)}
			{canClear ? <button type="button" className="vx-dateinput-clear" aria-label={`Clear ${props.fieldLabel ?? props.label ?? 'date'}`} onClick={clear}>{'×'}</button> : null}
			{isBusy ? <ActivityIndicator busy className="vx-dateinput-spinner" /> : null}
			<StatusGlyph status={props.status} variant={props.statusVariant} />
		</div>
	)

	const popover = surface === 'popover' || surface === 'sheet'
		? surface === 'popover'
			? <Popover anchor={anchor} open={open} onDismiss={() => setOpen(false)} placement="bottom" className="vx-dateinput-popover">
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
			: <BottomSheet isOpen={open} onOpenChange={(isOpen) => setOpen(isOpen)} label={props.label ?? props.accessibilityLabel ?? 'Choose a date'} height="hug" className="vx-dateinput-sheet">
				<Calendar
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
		: null

	const live = <div className="vx-sr-only" aria-live="assertive" role="alert">{!isPendingValid || rejected !== null ? 'Enter a valid date' : ''}</div>

	useImperativeHandle(props.ref, () => ({ focus: () => input.current?.focus(), blur: () => input.current?.blur(), native: input.current }), undefined);

	return showsDisabledReason
		? <><Tooltip trigger={shellNode} content={props.disabledMessage!} />{popover}{live}</>
		: <>{shellNode}{popover}{live}</>
}

/** Date entry field — ISO `value`, typed text + calendar. `presentation`
 *  picks the surface: `popover` (typed field + calendar), `bottom-sheet`,
 *  `native` (`<input type=date>` with the shared format painted over it), or
 *  the `adaptive-*` pointer-driven pair. Deprecated `nativePicker` maps onto
 *  the same surfaces (`presentation` wins). */
export function DateInput(props: DateInputProps) @{
	const inField = useContext(FieldContext) != null
	const isTouch = useCoarsePointer()
	const effective = effectivePresentation(props.presentation, props.nativePicker, 'date')
	const surface = resolveInputSurface(effective, isTouch)
	const cid = useId()

	if (inField) {
		return <DateInputControl {...props} surface={surface === 'popover' || surface === 'sheet' || surface === 'native' ? surface : 'popover'} />
	}

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
			<DateInputControl {...props} surface={surface === 'popover' || surface === 'sheet' || surface === 'native' ? surface : 'popover'} />
		</FormField>
	)
}
