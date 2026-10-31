/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useContext, useRef, useState } from 'octane'
import type { InputNumberProps, TextInputHandle } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityState } from '../overlays/escape-props'
import { FieldContext, useFieldControlProps } from './field-context'
import { FormField } from './FormField'
import { TextInput } from './TextInput.tsrx'
import { Pressable } from '../actions/Pressable'

/** One numeric owner supplies both the editor and the optional actions.
 * TextInput reconciles rejected edits without replacing its native editor. */
function InputNumberControl(inputProps: InputNumberProps): unknown @{
	const props = useFieldControlProps(inputProps)
	const editor = useRef<TextInputHandle | null>(null)
	const [internal, setInternal] = useState(props.defaultValue)
	const [draft, setDraft] = useState<{ text: string; value: number | null | undefined } | null>(null)
	const controlled = props.value !== undefined
	const value = controlled ? props.value : internal
	const isBlocked = props.isDisabled || props.isReadOnly
	const showSteppers = props.hasNumberSteppers !== false
	const clamp = (n: number) => Math.min(props.max ?? Infinity, Math.max(props.min ?? -Infinity, n))
	// Preserve incomplete decimal/exponent tokens only while they still
	// describe the owning number. Rejected controlled edits keep that owner.
	const display = draft && Object.is(draft.value, value) ? draft.text
		: value == null ? '' : props.formatValue ? props.formatValue(value) : String(value)
	const setValue = (next: number | null, text?: string) => {
		if (isBlocked) return
		setDraft(text === undefined ? null : { text, value: next })
		if (!controlled) setInternal(next)
		props.onValueChange?.(next)
	}
	const stepBy = (direction: number) => {
		if (!isBlocked) setValue(clamp((value ?? 0) + direction * (props.step ?? 1)))
	}
	const clear = () => {
		if (isBlocked) return
		setValue(null)
		props.onClear?.()
		editor.current?.focus()
	}

	<masonview
		ref={(v: any) => applyEscapeProps(v, props)}
		className={cx('vx-inputnumber', 'vx-inputnumber--native',
			props.isDisabled && 'vx-inputnumber--disabled',
			props.isReadOnly && 'vx-inputnumber--readonly',
			props.isLoading && 'vx-inputnumber--loading',
			props.status && `vx-inputnumber--status-${props.status.type}`,
			`vx-inputnumber--size-${props.size}`, props.className)}
		style={mergeStyle({ display: 'flex' }, props.style)}
		isEnabled={!props.isDisabled}
		accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled,
			readOnly: props.isReadOnly, busy: props.isLoading })}
	>
		{showSteppers ? (
			<Pressable key="decrement" className="vx-inputnumber-step" accessibilityRole="button" disabled={isBlocked}
				onPress={() => stepBy(-1)} accessibilityLabel="Decrement">
				<label text="−" />
			</Pressable>
		) : null}
		<TextInput key="editor" id={props.id} ref={editor} className="vx-inputnumber-field"
			keyboardType="decimal" size={props.size}
			accessibilityLabel={props.ariaLabel}
			isDisabled={props.isDisabled} isReadOnly={props.isReadOnly}
			isLoading={props.isLoading} isRequired={props.isRequired} isOptional={props.isOptional}
			status={props.status} placeholder={props.placeholder}
			value={display}
			onFocus={() => setDraft({ text: value == null ? '' : String(value), value })}
			onBlur={() => setDraft(null)}
			onChange={(text: string) => {
				if (isBlocked) return
				if (text === '') setValue(null, '')
				else {
					const next = parseFloat(text)
					const isNumericDraft = /^[+-]?(?:(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d*)?|\.?)$/i.test(text)
					if (!isNaN(next)) {
						const clamped = clamp(next)
						setValue(clamped, isNumericDraft && clamped === next ? text : undefined)
					} else if (isNumericDraft) setDraft({ text, value })
					else setDraft(null)
				}
			}}
		/>
		{props.units != null ? <label key="units" className="vx-inputnumber-units" text={props.units} /> : null}
		{showSteppers ? (
			<Pressable key="increment" className="vx-inputnumber-step" accessibilityRole="button" disabled={isBlocked}
				onPress={() => stepBy(1)} accessibilityLabel="Increment">
				<label text="+" />
			</Pressable>
		) : null}
		{props.hasClear && value != null && !isBlocked ? (
			<Pressable key="clear" className="vx-inputnumber-clear" accessibilityRole="button" accessibilityLabel="Clear value" onPress={clear}>
				<label text="×" />
			</Pressable>
		) : null}
	</masonview>
}

/** A persistent field frame keeps label/status/width outside the editor and
 * steppers. An explicit Field supplies the same defaults without nesting. */
export function InputNumber(inputProps: InputNumberProps): unknown @{
	const inField = useContext(FieldContext) != null
	const props = useFieldControlProps(inputProps)
	@if (inField) {
		<InputNumberControl {...inputProps} />
	} @else {
		<FormField inputID={props.id} label={props.label} description={props.description}
			status={props.status} statusVariant={props.statusVariant}
			isRequired={props.isRequired} isOptional={props.isOptional} isLabelHidden={props.isLabelHidden}
			isDisabled={props.isDisabled} isReadOnly={props.isReadOnly} isLoading={props.isLoading}
			size={props.size} labelTooltip={props.labelTooltip} disabledMessage={props.disabledMessage}
			width={props.width}>
			<InputNumberControl {...inputProps} />
		</FormField>
	}
}
