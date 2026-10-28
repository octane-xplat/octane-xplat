/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { useContext, useId, useState } from 'octane'
import type { InputNumberProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'
import { TextInput } from './text-controls.macos.tsrx'
import { Pressable } from './Pressable.macos.tsrx'
import { FieldContext, useFieldControlProps } from './field-context'
import { FormField } from './FormField.macos.tsrx'

/** InputNumber — normalized number field with −/+ steppers. Controlled via
 *  `value`/`onValueChange`, uncontrolled via `defaultValue`. Steppers clamp
 *  to `min`/`max`. */
function InputNumberControl(inputProps: InputNumberProps & { inputID: string; rootID?: string }) @{
	const props = useFieldControlProps(inputProps)
	const [internal, setInternal] = useState<number | null>(props.defaultValue ?? null)
	const controlled = props.value !== undefined
	const value = controlled ? props.value : internal
	const isBlocked = props.isDisabled || props.isReadOnly

	const clamp = (n: number) => Math.min(props.max ?? Infinity, Math.max(props.min ?? -Infinity, n))

	const setValue = (n: number | null) => {
		if (isBlocked) {
			return
		}

		if (!controlled) {
			setInternal(n)
		}

		props.onValueChange?.(n)
	}

	const stepBy = (dir: number) => {
		if (isBlocked) {
			return
		}

		setValue(clamp((value ?? 0) + dir * (props.step ?? 1)))
	}

	<masonview
		ref={(v: any) => applyEscapeProps(v, props)}
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
			onPress={() => stepBy(-1)}
			accessibilityLabel="Decrement"
		>
			<label text="−" />
		</Pressable> : null}
		<TextInput
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
			onChange={(text: string) => {
				const n = parseFloat(text)
				if (text === '') {
					setValue(null)
				} else if (!isNaN(n)) {
					setValue(clamp(n))
				}
			}}
		/>
		{props.units != null ? <label className="vx-inputnumber-units" text={props.units} /> : null}
		{props.hasNumberSteppers !== false ? <Pressable
			className="vx-inputnumber-step"
			disabled={isBlocked}
			onPress={() => stepBy(1)}
			accessibilityLabel="Increment"
		>
			<label text="+" />
		</Pressable> : null}
		{props.hasClear && value != null && !isBlocked ? <Pressable
			className="vx-inputnumber-clear"
			accessibilityLabel="Clear value"
			onPress={() => { setValue(null); props.onClear?.() }}
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
