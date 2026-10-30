/** @jsxImportSource @octane-xplat/jsx */
import { appKitTextChange } from '../../internal/platform/appkit-events.macos'
import { mergeStyle } from '../../internal/layout/style-merge'
import { createAppKitDateFieldHandle } from './date-field-handle.macos'
import { createAppKitAutoFocus } from '../../internal/accessibility/auto-focus.macos'
import {
	useImperativeHandle,
	useContext,
	useEffect,
	useLayoutEffect,
	useId,
	useMemo,
	useRef,
	useState,
	useCallback,
} from 'octane'

import type { ISOTimeString, TimeInputProps } from '../../props'
import type { NativeKeyboardEvent } from '@octane-xplat/jsx/intrinsics'
import type { NSTextField } from '@octane-xplat/platform/macos'
import { cx } from '@octane-xplat/lib'
import { dateMessages } from './date-messages'
import { hasDateComposition } from './date-composition'
import { runDateChangeAction } from './date-field-action'
import { Pressable } from '../actions/Pressable.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'
import { FieldContext, useFieldControlProps } from './field-context'
import {
	adjustTime,
	currentISOTime,
	formatDisplayTime12h,
	formatLocalizedTime,
	formatDisplayTime24h,
	isTimeInRange,
	parseTimeInput,
	resolveLocale,
} from './datetime'

const STATUS_TEXT = { error: '⚠', warning: '⚠', success: '✓' } as const

/** Time entry field — `HH:MM[:SS]` typed input. On macOS all presentations
 *  resolve to the typed field (fine pointer; the OS time control is the
 *  `@octane-xplat/date-picker` AppKit leaf). Plain Up/Down requests minute stepping;
 *  native key delivery is unqualified. The field also parses `2:30 PM`/`14:30`/`1430`. */
export function TimeInput(inputProps: TimeInputProps) @{
	const props = useFieldControlProps(inputProps)
	const messages = dateMessages(props.messages)
	const inField = useContext(FieldContext) != null
	const generatedId = useId()
	const inputId = props.id ?? generatedId
	const input = useRef<NSTextField | null>(null)
	const bindInput = useCallback((view: NSTextField | null) => {
		input.current = view
		autoFocus.bind(view)
	}, [])

	const writing = useRef(false),
		actionPending = useRef(false)

	const [pendingInput, setPendingInputState] = useState<string | null>(null)
	const pending = useRef<{ text: string | null }>({ text: null })
	const setPendingInput = (text: string | null) => {
		pending.current = { text }
		if (input.current) {
			setPendingInputState(text)
		}
	}

	const [busy, setBusy] = useState(false)

	const lastEmitted = useRef<ISOTimeString | null | undefined>(undefined)
	const value = props.value
	const shown = value
	const isDisabled = !!props.isDisabled || !!props.isReadOnly
	const isBusy = !!props.isLoading || busy
	const hasSeconds = !!props.hasSeconds
	const current = useRef({ props, shown, isDisabled, isBusy, hasSeconds })
	current.current = { props, shown, isDisabled, isBusy, hasSeconds }
	const canEdit = () =>
		!!input.current &&
		!current.current.isDisabled &&
		!current.current.isBusy &&
		!writing.current &&
		!actionPending.current

	const autoFocus = useMemo(
		() =>
			createAppKitAutoFocus({
				requested: () => current.current.props.hasAutoFocus === true,
				blocked: () =>
					current.current.isDisabled || current.current.isBusy || actionPending.current,
			}),
		[],
	)

	useLayoutEffect(() => autoFocus.update(), null)
	useEffect(() => () => autoFocus.dispose(), [])
	useImperativeHandle(
		props.ref,
		() =>
			createAppKitDateFieldHandle({
				primary: () => input.current,
				blocked: () =>
					current.current.isDisabled || current.current.isBusy || actionPending.current,
			}),
		[],
	)

	const formatDisplay = (time: ISOTimeString, seconds: boolean) =>
		props.locale
			? formatLocalizedTime(time, seconds, props.hourFormat ?? '12h', resolveLocale(props.locale))
			: (props.hourFormat === '24h' ? formatDisplayTime24h : formatDisplayTime12h)(time, seconds)

	// Preserve typing on an echoed edit; external values replace the draft.
	useEffect(() => {
		if (value !== lastEmitted.current) {
			setPendingInput(null)
		}

		lastEmitted.current = undefined
	}, [value])

	const fireChange = (next: ISOTimeString | null | undefined): boolean => {
		const live = current.current
		if (
			!input.current ||
			writing.current ||
			actionPending.current ||
			live.isDisabled ||
			live.isBusy
		) {
			return false
		}

		const emitted = next ?? null
		writing.current = true // Claim before application callbacks can reenter or flush parent props.
		try {
			lastEmitted.current = emitted
			live.props.onChange?.(emitted)
			if (live.props.changeAction) {
				actionPending.current = true
				if (input.current) {
					setBusy(true)
				}

				runDateChangeAction(
					() => live.props.changeAction!(emitted),
					() => {
						actionPending.current = false
						if (input.current) {
							setBusy(false)
						}
					},
				)
			}

			return true
		} finally {
			writing.current = false
		}
	}

	const handleKeyDown = (event: NativeKeyboardEvent<NSTextField>) => {
		const live = current.current
		if (
			!input.current ||
			event.target !== input.current ||
			live.isDisabled ||
			live.isBusy ||
			writing.current ||
			actionPending.current ||
			event.defaultPrevented ||
			event.isComposing ||
			hasDateComposition(input.current) ||
			event.altKey ||
			event.ctrlKey ||
			event.metaKey ||
			event.shiftKey ||
			(event.key !== 'ArrowUp' && event.key !== 'ArrowDown')
		) {
			return
		}

		event.preventDefault()
		event.stopPropagation()
		const increment = live.props.increment ?? 1
		const base = live.shown ?? currentISOTime(live.hasSeconds)
		const next = adjustTime(base, event.key === 'ArrowUp' ? increment : -increment, live.hasSeconds)
		const ownedDraft = pending.current
		if (
			next !== live.shown &&
			isTimeInRange(next, live.props.min, live.props.max) &&
			fireChange(next) &&
			input.current &&
			pending.current === ownedDraft
		) {
			setPendingInput(null)
		}
	}

	const pendingParsed =
		pendingInput != null && pendingInput.trim() ? parseTimeInput(pendingInput, hasSeconds) : null

	const isPendingValid =
		pendingInput == null || !pendingInput.trim()
			? true
			: pendingParsed !== null && isTimeInRange(pendingParsed, props.min, props.max)

	const commitParsed = (parsed: ISOTimeString | null): boolean => {
		const live = current.current
		return canEdit() &&
			parsed !== null &&
			isTimeInRange(parsed, live.props.min, live.props.max) &&
			parsed !== live.shown
			? fireChange(parsed)
			: false
	}

	const commitPending = () => {
		if (!canEdit() || hasDateComposition(input.current)) {
			return
		}

		const ownedDraft = pending.current,
			live = current.current

		if (ownedDraft.text == null) {
			return
		}

		if (!ownedDraft.text.trim()) {
			if (live.shown != null) {
				fireChange(undefined)
			}
		} else {
			commitParsed(parseTimeInput(ownedDraft.text, live.hasSeconds))
		}

		if (input.current && pending.current === ownedDraft) {
			setPendingInput(null)
		}
	}

	const handleTextChange = (text: string) => {
		if (!canEdit()) {
			return
		}

		setPendingInput(text)
		if (hasDateComposition(input.current)) {
			return
		}

		commitParsed(parseTimeInput(text, current.current.hasSeconds))
	}

	const displayText = pendingInput ?? (shown ? formatDisplay(shown, hasSeconds) : '')
	const statusText = props.status ? STATUS_TEXT[props.status.type] : null

	const control = (
		<masonview
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
			style={mergeStyle(
				{ flexDirection: 'row', alignItems: 'center' },
				mergeStyle({ display: 'flex' }, props.style),
			)}
		>
			<textfield
				ref={bindInput}
				id={inputId}
				className={cx('vx-timeinput-input', !isPendingValid && 'vx-timeinput-input--invalid')}
				value={displayText}
				placeholder={props.placeholder ?? 'Select a time'}
				isEnabled={!isDisabled && !isBusy}
				editable={!isDisabled && !isBusy}
				onTextChange={appKitTextChange(handleTextChange)}
				onBlur={commitPending}
				onSubmit={commitPending}
				onKeyDown={handleKeyDown}
				accessibilityLabel={
					props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
				}
				accessibilityHint={!isPendingValid ? messages.invalidTime : props.accessibilityHint}
				accessibilityState={{
					disabled: isDisabled,
					busy: isBusy,
					required: props.isRequired && !props.isOptional,
					invalid: props.status?.type === 'error' || !isPendingValid,
				}}
			/>
			{props.hasClear && shown != null && !isDisabled && !isBusy ? (
				<Pressable
					className="vx-timeinput-clear"
					accessibilityLabel={`Clear ${props.fieldLabel ?? props.label ?? 'time'}`}
					onPress={() => {
						if (!canEdit() || current.current.shown == null) {
							return
						}

						const ownedDraft = pending.current
						if (fireChange(undefined) && input.current && pending.current === ownedDraft) {
							setPendingInput(null)
						}
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
	)

	<>
		{inField ? (
			control
		) : (
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
