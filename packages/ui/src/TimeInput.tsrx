/** @jsxImportSource @nativescript-community/octane */
import { useImperativeHandle, useContext, useEffect, useId, useRef, useState } from 'octane'
import type { ISOTimeString, TimeInputProps } from './props'
import { cx } from './cx'
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
import {
	effectivePresentation,
	formatDisplayTime12h,
	formatDisplayTime24h,
	isTimeInRange,
	parseTimeInput,
	resolveInputSurface,
} from './datetime'

import { TimeWheelPanel } from './TimeWheelPanel'

const STATUS_TEXT = { error: '⚠', warning: '⚠', success: '✓' } as const

interface CoreProps extends TimeInputProps {
	surface: 'typed' | 'sheet'
}

function TimeInputControl(inputProps: CoreProps) @{
	const props = useFieldControlProps(inputProps)
	const surface = inputProps.surface
	const generatedId = useId()
	const inputId = props.id ?? generatedId
	const input = useRef<any>(null)

	const [open, setOpen] = useState(false)
	const [pendingInput, setPendingInput] = useState<string | null>(null)
	const [busy, setBusy] = useState(false)

	const lastEmitted = useRef<ISOTimeString | undefined>(undefined)
	const value = props.value
	const shown = value
	const isDisabled = !!props.isDisabled || !!props.isReadOnly
	const isBusy = !!props.isLoading || busy
	const hasSeconds = !!props.hasSeconds
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

	const pendingParsed = pendingInput != null && pendingInput.trim() ? parseTimeInput(pendingInput, hasSeconds) : null
	const isPendingValid = pendingInput == null || !pendingInput.trim()
		? true
		: pendingParsed !== null && isTimeInRange(pendingParsed, props.min, props.max)

	const commitParsed = (parsed: ISOTimeString | null) => {
		if (parsed && isTimeInRange(parsed, props.min, props.max) && parsed !== shown) {
			fireChange(parsed)
			return true
		}

		return false
	}

	const commitPending = () => {
		if (pendingInput == null) return
		if (!pendingInput.trim()) {
			if (shown != null) fireChange(undefined)
		} else {
			commitParsed(parseTimeInput(pendingInput, hasSeconds))
		}

		setPendingInput(null)
		if (input.current) writeText(input.current, shown ? formatDisplay(shown, hasSeconds) : '')
	}

	const handleTextChange = (e: any) => {
		if (isDisabled || isWritingText(e.object)) return
		const text = e.value as string
		setPendingInput(text)
		commitParsed(parseTimeInput(text, hasSeconds))
	}

	const displayText = pendingInput ?? (shown ? formatDisplay(shown, hasSeconds) : '')
	const statusText = props.status ? STATUS_TEXT[props.status.type] : null

	// Imperative text writes — the textfield's text isn't a bound prop.
	useEffect(() => {
		if (surface === 'typed' && input.current && pendingInput == null) {
			writeText(input.current, displayText)
		}
	}, [displayText])

	useImperativeHandle(props.ref, () => ({ focus: () => input.current.focus(), blur: () => blurText(input.current), native: input.current }), undefined);

	<>
		<flexboxlayout
			flexDirection="row"
			alignItems="center"
			className={cx(
				'vx-timeinput',
				`vx-timeinput--${surface}`,
				isDisabled && 'vx-timeinput--disabled',
				isBusy && 'vx-timeinput--loading',
				props.status && `vx-timeinput--status-${props.status.type}`,
				props.size && `vx-timeinput--size-${props.size}`,
				!isPendingValid && 'vx-timeinput--invalid',
				props.className,
			)}
			style={props.style}
		>
			<Pressable
				className="vx-timeinput-toggle"
				accessibilityLabel="Open time picker"
				disabled={isDisabled || isBusy}
				onPress={() => { if (!isDisabled && !isBusy && surface === 'sheet') setOpen(true) }}
			>
				<Icon name="xplat-clock" size={16} />
			</Pressable>
			{surface === 'typed' ? (
				<textfield
					ref={(v: any) => { input.current = v; }}
					id={inputId}
					className={cx('vx-timeinput-input', !isPendingValid && 'vx-timeinput-input--invalid')}
					hint={props.placeholder ?? 'Select a time'}
					isEnabled={!isDisabled && !isBusy}
					editable={!isDisabled && !isBusy}
					accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
					accessibilityHint={props.accessibilityHint}
					accessibilityState={nativeAccessibilityState({ disabled: isDisabled, busy: isBusy, required: props.isRequired && !props.isOptional, invalid: props.status?.type === 'error' || !isPendingValid } as any) as any}
					onTextChange={handleTextChange}
					onBlur={commitPending}
					onReturnPress={commitPending}
					autocorrect={false}
				/>
			) : (
				<Pressable
					className={cx('vx-timeinput-input', 'vx-timeinput-segment', !shown && 'vx-timeinput-segment--placeholder')}
					disabled={isDisabled || isBusy}
					accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
					accessibilityHint={props.accessibilityHint}
					accessibilityState={{ disabled: isDisabled }}
					onPress={() => { if (!isDisabled && !isBusy) setOpen(true) }}
				>
					<label text={shown ? formatDisplay(shown, hasSeconds) : (props.placeholder ?? 'Select a time')} />
				</Pressable>
			)}
			{props.hasClear && shown != null && !isDisabled && !isBusy
				? <Pressable className="vx-timeinput-clear" accessibilityLabel={`Clear ${props.fieldLabel ?? props.label ?? 'time'}`} onPress={() => { setPendingInput(null); fireChange(undefined); if (input.current) writeText(input.current, '') }}><label text="×" /></Pressable>
				: null}
			{statusText != null
				? <label className={cx('vx-field-icon', `vx-field-icon--${props.status!.type}`)} text={statusText} accessibilityLabel={props.statusVariant === 'tooltip' ? props.status?.message : undefined} />
				: null}
		</flexboxlayout>
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
	</>
}

/**
 * Time entry field — `HH:MM[:SS]` values. `text-input`/`popover`
 * presentations keep the typed field; `bottom-sheet` and `native`/
 * `adaptive-*` resolve to the self-drawn wheel sheet (the OS time picker is
 * the `@octane-xplat/date-picker` leaf, not part of the shared control).
 * Arrow-key stepping has no touch equivalent — the typed field still parses.
 */
export function TimeInput(props: TimeInputProps) @{
	const inField = useContext(FieldContext) != null
	const effective = effectivePresentation(props.presentation, props.nativePicker, 'time')
	const resolved = resolveInputSurface(effective, true)
	const surface: 'typed' | 'sheet' = resolved === 'sheet' || resolved === 'native' ? 'sheet' : 'typed'
	const cid = useId()

	const control = <TimeInputControl {...props} surface={surface} />

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
