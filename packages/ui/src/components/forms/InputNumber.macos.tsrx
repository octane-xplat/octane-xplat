/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useCallback, useContext, useId, useRef, useState } from 'octane'
import type { InputNumberProps, TextInputHandle } from '../../props'
import type { NSView } from '@octane-xplat/platform/macos'
import { cx } from '@octane-xplat/lib'
import { hasDateComposition } from './date-composition.macos'
import { TextInput } from './text-controls.macos.tsrx'
import { Pressable } from '../actions/Pressable.macos.tsrx'
import { FieldContext, useFieldControlProps } from './field-context'
import { FormField } from './FormField.macos.tsrx'

type NumberRequest = { kind: 'edit'; text: string } | { kind: 'step'; direction: -1 | 1 } | { kind: 'clear' }

/** InputNumber — normalized number field with −/+ steppers. Controlled via
 *  `value`/`onValueChange`, uncontrolled via `defaultValue`. Steppers clamp
 *  to `min`/`max`. */
function InputNumberControl(inputProps: InputNumberProps & { inputID: string; rootID?: string }) @{
	const props = useFieldControlProps(inputProps)
	const [internal, setInternal] = useState<number | null>(props.defaultValue ?? null)
	const controlled = props.value !== undefined
	const value = controlled ? props.value : internal
	const isBlocked = props.isDisabled || props.isReadOnly

	const local = useRef(internal), live = useRef(props)
	live.current = props
	const attached = useRef(false), active = useRef<symbol | null>(null)
	const input = useRef<TextInputHandle | null>(null)
	const bind = useCallback((view: NSView | null) => {
		attached.current = Boolean(view)
		if (!view) active.current = null
	}, [])
	const request = (action: NumberRequest) => {
		const props = live.current
		if (!attached.current || props.isDisabled || props.isReadOnly || active.current) return
		const token = Symbol('number-input-change')
		active.current = token
		try {
			const previous = props.value !== undefined ? props.value : local.current
			const clamp = (n: number) => Math.min(props.max ?? Infinity, Math.max(props.min ?? -Infinity, n))
			let next: number | null
			if (action.kind !== 'edit') {
				const field = input.current?.native
				if (!field || hasDateComposition(field)) return
			}
			if (action.kind === 'clear') {
				if (!props.hasClear || previous == null) return
				next = null
			} else if (action.kind === 'step') {
				if (props.hasNumberSteppers === false) return
				next = clamp((previous ?? 0) + action.direction * (props.step ?? 1))
			} else if (action.text === '') next = null
			else {
				const parsed = parseFloat(action.text)
				if (isNaN(parsed)) return
				next = clamp(parsed)
			}
			const change = props.onValueChange, clear = action.kind === 'clear' ? props.onClear : undefined
			if (!attached.current || active.current !== token || live.current !== props) return
			if (props.value === undefined) { local.current = next; setInternal(next) }
			change?.(next)
			// Accepted clear owns its callback pair across parent replacement/detach.
			clear?.()
		} finally {
			if (active.current === token) active.current = null
		}
	}

	<masonview
		ref={bind}
		id={props.rootID}
		className={cx(
			'vx-inputnumber',
			props.isDisabled && 'vx-inputnumber--disabled',
			props.isReadOnly && 'vx-inputnumber--readonly',
			props.isLoading && 'vx-inputnumber--loading',
			props.status && `vx-inputnumber--status-${props.status.type}`,
			`vx-inputnumber--size-${props.size}`,
			props.className,
		)}
		style={mergeStyle({ display: 'flex', flexDirection: 'row', alignItems: 'center' }, props.style)}
		accessibilityState={{
			disabled: props.isDisabled,
			readonly: props.isReadOnly,
			busy: props.isLoading,
		}}
	>
		{props.hasNumberSteppers !== false ? <Pressable
			className="vx-inputnumber-step"
			disabled={isBlocked}
			onPress={() => request({ kind: 'step', direction: -1 })}
			accessibilityLabel="Decrement"
		>
			<label text="−" />
		</Pressable> : null}
		<TextInput
			ref={input}
			id={props.inputID}
			className="vx-inputnumber-field"
			size={props.size}
			status={props.status}
			isLoading={props.isLoading}
			isRequired={props.isRequired}
			isOptional={props.isOptional}
			description={inputProps.description}
			disabledMessage={inputProps.disabledMessage}
			accessibilityLabel={props.ariaLabel ?? props.fieldLabel ?? props.label}
			keyboardType="decimal"
			isDisabled={props.isDisabled}
			isReadOnly={props.isReadOnly}
			placeholder={props.placeholder}
			value={value == null ? '' : props.formatValue ? props.formatValue(value) : String(value)}
			onChange={(text: string) => request({ kind: 'edit', text })}
		/>
		{props.units != null ? <label className="vx-inputnumber-units" text={props.units} /> : null}
		{props.hasNumberSteppers !== false ? <Pressable
			className="vx-inputnumber-step"
			disabled={isBlocked}
			onPress={() => request({ kind: 'step', direction: 1 })}
			accessibilityLabel="Increment"
		>
			<label text="+" />
		</Pressable> : null}
		{props.hasClear && value != null && !isBlocked ? <Pressable
			className="vx-inputnumber-clear"
			accessibilityLabel="Clear value"
			onPress={() => request({ kind: 'clear' })}
		><label text="×" /></Pressable> : null}
	</masonview>
}


/** A stable standalone Field owns metadata; an enclosing Field keeps ownership. */
export function InputNumber(props: InputNumberProps) @{
	const field = useContext(FieldContext)
	const generatedID = useId()
	const inputID = field?.controlId ?? generatedID
	@if (field) {
		<InputNumberControl {...props} inputID={inputID} rootID={props.id === inputID ? undefined : props.id} />
	} @else {
		<FormField
			id={props.id}
			inputID={inputID}
			label={props.label}
			description={props.description}
			status={props.status}
			statusVariant={props.statusVariant}
			isRequired={props.isRequired}
			isOptional={props.isOptional}
			isLabelHidden={props.isLabelHidden}
			isDisabled={props.isDisabled}
			isReadOnly={props.isReadOnly}
			isLoading={props.isLoading}
			size={props.size}
			labelTooltip={props.labelTooltip}
			disabledMessage={props.disabledMessage}
			width={props.width}
		>
			<InputNumberControl {...props} inputID={inputID} />
		</FormField>
	}
}
