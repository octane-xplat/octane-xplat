import { useImperativeHandle, useContext, useEffect, useId, useMemo, useRef, useState } from 'octane'
import type { ISOTimeString, TimeInputProps } from './props'
import { cx } from './cx'
import { runDateChangeAction } from './date-field-action'
import { Icon } from './Icon.web.tsrx'
import { FormField } from './FormField.web.tsrx'
import { BottomSheet } from './BottomSheet.web.tsrx'
import { Tooltip } from './Tooltip.web.tsrx'
import { ActivityIndicator } from './ActivityIndicator.web.tsrx'
import { FieldContext, useFieldControlProps } from './field-context'
import {
	adjustTime,
	currentISOTime,
	effectivePresentation,
	formatDisplayTime12h,
	formatDisplayTime24h,
	formatISOTime,
	isTimeInRange,
	parseISOTime,
	parseTimeInput,
	resolveInputSurface,
} from './datetime'

import { TimeWheelPanel } from './TimeWheelPanel.web.tsrx'

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

interface TimeStatusGlyphProps {
	status?: { type: 'warning' | 'error' | 'success'; message?: string }
	variant?: string
}

function TimeStatusGlyph(props: TimeStatusGlyphProps) @{
	if (!props.status) return null
	const span = <span className={cx('vx-field-icon', `vx-field-icon--${props.status.type}`)}>{STATUS_GLYPHS[props.status.type]}</span>
	if (props.variant === 'tooltip' && props.status.message) return <Tooltip trigger={span} content={props.status.message} />
	return span
}

interface CoreProps extends TimeInputProps {
	surface: 'typed' | 'sheet' | 'native'
	/** `adaptive`/`legacy` native surfaces keep the typed field when the OS
	 *  control can't express the contract (`hasSeconds`, `increment !== 1`). */
	nativeFallback: boolean
}

function TimeInputControl(inputProps: CoreProps) @{
	const props = useFieldControlProps(inputProps)
	const surface = inputProps.surface === 'native' && inputProps.nativeFallback ? 'typed' : inputProps.surface
	const generatedId = useId()
	const inputId = props.id ?? generatedId
	const anchor = useRef<any>(null)
	const input = useRef<HTMLInputElement | null>(null)

	const [open, setOpen] = useState(false)
	const [pendingInput, setPendingInput] = useState<string | null>(null)
	const [isFocused, setIsFocused] = useState(false)
	const [busy, setBusy] = useState(false)
	const [announcement, setAnnouncement] = useState('')

	const lastEmitted = useRef<ISOTimeString | undefined>(undefined)
	const value = props.value
	const shown = value
	const isDisabled = !!props.isDisabled || !!props.isReadOnly
	const isBusy = !!props.isLoading || busy
	const canClear = !!props.hasClear && shown != null && !isDisabled && !isBusy
	const showsDisabledReason = isDisabled && !!props.disabledMessage
	const hasSeconds = !!props.hasSeconds
	const increment = props.increment ?? 1
	const formatDisplay = props.hourFormat === '24h' ? formatDisplayTime24h : formatDisplayTime12h

	// Preserve typing on an echoed edit; external values replace the draft.
	useEffect(() => {
		if (value !== lastEmitted.current) {
			setPendingInput(null)
		}

		lastEmitted.current = undefined
	}, [value])

	const fireChange = (next: ISOTimeString | undefined) => {
		if (isDisabled || isBusy) return
		lastEmitted.current = next
		props.onChange?.(next)
		if (props.changeAction) {
			setBusy(true)
			runDateChangeAction(() => props.changeAction!(next), () => setBusy(false))
		}
	}

	const parsedPending = pendingInput != null && pendingInput.trim() ? parseTimeInput(pendingInput, hasSeconds) : null
	const isPendingValid = pendingInput == null || !pendingInput.trim()
		? true
		: parsedPending !== null && isTimeInRange(parsedPending, props.min, props.max)

	const commitParsed = (parsed: ISOTimeString | null) => {
		if (parsed && isTimeInRange(parsed, props.min, props.max) && parsed !== shown) {
			fireChange(parsed)
			return true
		}

		return false
	}

	const handleType = (e: any) => {
		if (isDisabled) return
		const text = e.target.value as string
		setPendingInput(text)
		commitParsed(parseTimeInput(text, hasSeconds))
	}

	const handleBlur = () => {
		setIsFocused(false)
		if (pendingInput == null) return
		if (!pendingInput.trim()) {
			if (shown != null) fireChange(undefined)
		} else {
			commitParsed(parseTimeInput(pendingInput, hasSeconds))
		}

		setPendingInput(null)
	}

	const handleKeyDown = (e: any) => {
		if (isDisabled || e.isComposing || e.keyCode === 229) return
		if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
			e.preventDefault()
			const base = shown ?? currentISOTime(hasSeconds)
			const next = adjustTime(base, e.key === 'ArrowUp' ? increment : -increment, hasSeconds)
			if (isTimeInRange(next, props.min, props.max)) {
				fireChange(next)
				setAnnouncement(formatDisplay(next, hasSeconds))
			}
		}
	}

	const displayValue = pendingInput ?? (shown ? formatDisplay(shown, hasSeconds) : '')
	const displayPlaceholder = isFocused && !displayValue
		? (props.hourFormat === '24h' ? 'e.g., 14:30' : 'e.g., 2:30 PM')
		: (props.placeholder ?? 'Select a time')

	const clear = (e?: any) => {
		e?.stopPropagation?.()
		setPendingInput(null)
		fireChange(undefined)
		if (surface !== 'native') input.current?.focus({ preventScroll: true })
	}

	const lastCommit = useRef<string | null>(null)
	const handleNativeCommit = (e: any) => {
		const raw = (e.target.value ?? '') as string
		if (lastCommit.current === raw) return
		lastCommit.current = raw
		if (!raw) { if (value !== undefined) fireChange(undefined); return }
		const parsed = parseTimeInput(raw, true)
		if (!parsed || !isTimeInRange(parsed, props.min, props.max)) return
		const normalized = formatISOTime(parseISOTime(parsed)!, hasSeconds)
		if (normalized !== value) fireChange(normalized)
	}

	const openNativePicker = () => {
		if (isDisabled) return
		input.current?.focus?.()
		try { (input.current as any)?.showPicker?.() } catch {}
	}

	const iconButton = (
		<button
			type="button"
			className="vx-timeinput-toggle"
			aria-label={surface === 'native' ? 'Open time picker' : open ? 'Close time picker' : 'Open time picker'}
			aria-expanded={surface === 'sheet' ? open : undefined}
			disabled={isDisabled || isBusy || undefined}
			tabIndex={-1}
			onClick={() => {
				if (surface === 'native') openNativePicker()
				else if (surface === 'sheet') setOpen(true)
			}}
		>
			<Icon name="xplat-clock" size={16} />
		</button>
	)

	const shellNode = (
		<div
			ref={(el: any) => { anchor.current = el }}
			className={cx(
				'vx-timeinput',
				`vx-timeinput--${surface}`,
				isDisabled && 'vx-timeinput--disabled',
				isBusy && 'vx-timeinput--loading',
				props.status && `vx-timeinput--status-${props.status.type}`,
				props.size && `vx-timeinput--size-${props.size}`,
				(!isPendingValid) && 'vx-timeinput--invalid',
				props.className,
			)}
			style={props.style}
		>
			{iconButton}
			{surface === 'native' ? (
				<span className="vx-timeinput-nativeslot">
					<input
						ref={(el: any) => { input.current = el; }}
						id={inputId}
						type="time"
						className={cx('vx-timeinput-nativeinput', 'vx-timeinput-input')}
						value={shown ?? ''}
						min={props.min}
						max={props.max}
						step={hasSeconds ? 1 : 60}
						disabled={isDisabled && !showsDisabledReason || undefined}
						aria-disabled={showsDisabledReason || undefined}
						readOnly={showsDisabledReason || undefined}
						autoFocus={props.hasAutoFocus || undefined}
						aria-label={props.ariaLabel}
						aria-labelledby={props.ariaLabelledBy}
						aria-describedby={props.ariaDescribedBy}
						aria-required={props.isRequired && !props.isOptional || undefined}
						aria-invalid={props.status?.type === 'error' || undefined}
						aria-busy={isBusy || undefined}
						onChange={handleNativeCommit}
						onInput={handleNativeCommit}
					/>
					<span className="vx-timeinput-overlay" aria-hidden="true">
						{shown ? formatDisplay(shown, hasSeconds) : <span className="vx-timeinput-overlay--placeholder">{props.placeholder ?? 'Select a time'}</span>}
					</span>
				</span>
			) : surface === 'sheet' ? (
				<button
					type="button"
					className={cx('vx-timeinput-input', 'vx-timeinput-segment', !shown && 'vx-timeinput-segment--placeholder')}
					disabled={isDisabled || isBusy || undefined}
					aria-label={props.ariaLabel}
					aria-labelledby={props.ariaLabelledBy}
					aria-describedby={props.ariaDescribedBy}
					aria-required={props.isRequired && !props.isOptional || undefined}
					aria-expanded={open}
					aria-haspopup="dialog"
					onClick={() => { if (!isDisabled && !isBusy) setOpen(true) }}
				>
					{shown ? formatDisplay(shown, hasSeconds) : (props.placeholder ?? 'Select a time')}
				</button>
			) : (
				<input
					ref={(el: any) => { input.current = el; }}
					id={inputId}
					type="text"
					className={cx('vx-timeinput-input', !isPendingValid && 'vx-timeinput-input--invalid')}
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
					onInput={handleType}
					onFocus={() => { if (!isDisabled) setIsFocused(true) }}
					onBlur={handleBlur}
					onKeyDown={handleKeyDown}
				/>
			)}
			{canClear ? <button type="button" className="vx-timeinput-clear" aria-label={`Clear ${props.fieldLabel ?? props.label ?? 'time'}`} onClick={clear}>{'×'}</button> : null}
			{isBusy ? <ActivityIndicator busy className="vx-timeinput-spinner" /> : null}
			<TimeStatusGlyph status={props.status} variant={props.statusVariant} />
		</div>
	)

	useImperativeHandle(props.ref, () => ({ focus: () => input.current?.focus(), blur: () => input.current?.blur(), native: input.current }), undefined);

	<>
		{showsDisabledReason ? <Tooltip trigger={shellNode} content={props.disabledMessage!} /> : shellNode}
		{surface === 'sheet' ? (
			<BottomSheet isOpen={open} onOpenChange={(isOpen) => setOpen(isOpen)} label={props.label ?? props.accessibilityLabel ?? 'Choose a time'} height="hug" className="vx-timeinput-sheet">
				<TimeWheelPanel
					value={shown}
					hasSeconds={hasSeconds}
					hourFormat={props.hourFormat ?? '12h'}
					min={props.min}
					max={props.max}
					onCommit={(t) => { fireChange(t); setOpen(false) }}
					onDismiss={() => setOpen(false)}
				/>
			</BottomSheet>
		) : null}
		<div className="vx-sr-only" aria-live="polite" role="status">{announcement}</div>
		<div className="vx-sr-only" aria-live="assertive" role="alert">{!isPendingValid ? 'Enter a valid time' : ''}</div>
	</>
}

/** Time entry field — `HH:MM[:SS]` values, typed input with arrow-key
 *  stepping, wheel sheet on touch surfaces, `<input type=time>` for
 *  `native`. `adaptive-native` (default) keeps the typed field when the OS
 *  picker can't express the contract (`hasSeconds`, `increment !== 1`). */
export function TimeInput(props: TimeInputProps) @{
	const inField = useContext(FieldContext) != null
	const isTouch = useCoarsePointer()
	const effective = effectivePresentation(props.presentation, props.nativePicker, 'time')
	let surface = resolveInputSurface(effective, isTouch)
	if (surface === 'popover') surface = 'typed'
	// Released fallback: adaptive resolution (and deprecated `always`) keep
	// the typed field where the OS control can't express seconds/custom
	// cadence; explicit `presentation="native"` is forced — no fallback.
	const nativeFallback = surface === 'native' && effective !== 'native' && (!!props.hasSeconds || (props.increment ?? 1) !== 1)
	const cid = useId()

	const control = <TimeInputControl {...props} surface={surface === 'native' ? 'native' : surface === 'sheet' ? 'sheet' : 'typed'} nativeFallback={nativeFallback} />
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
