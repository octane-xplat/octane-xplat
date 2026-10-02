/** @jsxImportSource @octane-xplat/macos-renderer */
import { useContext, useId, useState } from 'octane'
import type { ISOTimeString, TimeInputProps } from './props'
import { cx } from './cx'
import { Pressable } from './Pressable.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'
import { FieldContext, useFieldControlProps } from './field-context'
import {
	formatDisplayTime12h,
	formatDisplayTime24h,
	isTimeInRange,
	parseTimeInput,
} from './datetime'

const STATUS_TEXT = { error: '⚠', warning: '⚠', success: '✓' } as const

/** Time entry field — `HH:MM[:SS]` typed input. On macOS all presentations
 *  resolve to the typed field (fine pointer; the OS time control is the
 *  `@octane-xplat/date-picker` AppKit leaf). Arrow stepping is AppKit-host
 *  scope — the field still parses `2:30 PM`/`14:30`/`1430`. */
export function TimeInput(inputProps: TimeInputProps) @{
	const props = useFieldControlProps(inputProps)
	const inField = useContext(FieldContext) != null
	const generatedId = useId()
	const inputId = props.id ?? generatedId

	const [pendingInput, setPendingInput] = useState<string | null>(null)
	const [busy, setBusy] = useState(false)
	const [draft, setDraft] = useState<ISOTimeString | null | undefined>(undefined)

	const value = props.value
	const shown: ISOTimeString | undefined = draft === undefined ? value : (draft ?? undefined)
	const isDisabled = !!props.isDisabled || !!props.isReadOnly
	const isBusy = !!props.isLoading || busy
	const hasSeconds = !!props.hasSeconds
	const formatDisplay = props.hourFormat === '24h' ? formatDisplayTime24h : formatDisplayTime12h

	const fireChange = (next: ISOTimeString | undefined) => {
		setDraft(next === undefined ? null : next)
		props.onChange?.(next)
		if (props.changeAction) {
			setBusy(true)
			Promise.resolve(props.changeAction(next)).finally(() => setBusy(false))
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
	}

	const handleTextChange = (text: string) => {
		if (isDisabled) return
		setPendingInput(text)
		commitParsed(parseTimeInput(text, hasSeconds))
	}

	const displayText = pendingInput ?? (shown ? formatDisplay(shown, hasSeconds) : '')
	const statusText = props.status ? STATUS_TEXT[props.status.type] : null

	const control = (
		<flexboxlayout
			flexDirection="row"
			alignItems="center"
			className={cx(
				'vx-timeinput',
				'vx-timeinput--typed',
				isDisabled && 'vx-timeinput--disabled',
				isBusy && 'vx-timeinput--loading',
				props.status && `vx-timeinput--status-${props.status.type}`,
				props.size && `vx-timeinput--size-${props.size}`,
				!isPendingValid && 'vx-timeinput--invalid',
				props.className,
			)}
			style={props.style}
		>
			<textfield
				id={inputId}
				className={cx('vx-timeinput-input', !isPendingValid && 'vx-timeinput-input--invalid')}
				value={displayText}
				placeholder={props.placeholder ?? 'Select a time'}
				isEnabled={!isDisabled && !isBusy}
				editable={!isDisabled && !isBusy}
				onTextChange={handleTextChange}
				onBlur={commitPending}
				accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
				accessibilityHint={props.accessibilityHint}
				accessibilityState={{ disabled: isDisabled, busy: isBusy, required: props.isRequired && !props.isOptional, invalid: props.status?.type === 'error' || !isPendingValid }}
			/>
			{props.hasClear && shown != null && !isDisabled && !isBusy
				? <Pressable className="vx-timeinput-clear" accessibilityLabel={`Clear ${props.fieldLabel ?? props.label ?? 'time'}`} onPress={() => { setPendingInput(null); fireChange(undefined) }}><label text="×" /></Pressable>
				: null}
			{statusText != null
				? <label className={cx('vx-field-icon', `vx-field-icon--${props.status!.type}`)} text={statusText} accessibilityLabel={props.statusVariant === 'tooltip' ? props.status?.message : undefined} />
				: null}
		</flexboxlayout>
	)

	<>
		{inField ? control : (
			<FormField
				inputID={props.id ?? generatedId}
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
