/** @jsxImportSource @octane-xplat/jsx/dom */
import { useState } from 'octane'
import type { InputNumberProps } from '../../props'
import { useSize } from '../layout/size-context'
import { applyEscapeProps } from '../overlays/escape-props'
import { TextInput } from './TextInput.web.tsrx'
import { Pressable } from '../actions/Pressable.web.tsrx'

/** InputNumber — normalized number field with −/+ steppers. `units` draws a
 *  trailing suffix; `formatValue` renders the committed value; `hasClear`
 *  adds a reset affordance. `hasNumberSteppers` gates the buttons
 *  (default shown). */
export function InputNumber(props: InputNumberProps) @{
	const size = useSize(props.size, 'md')
	const [internal, setInternal] = useState(props.defaultValue)
	const controlled = props.value !== undefined
	const value = controlled ? props.value : internal
	const isBlocked = props.isDisabled || props.isReadOnly
	const showSteppers = props.hasNumberSteppers !== false

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

	const clear = () => {
		if (isBlocked) {
			return
		}

		setValue(null)
		props.onClear?.()
	}

	const display = value == null ? '' : props.formatValue ? props.formatValue(value) : String(value)

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		aria-disabled={props.isDisabled || undefined}
		aria-readonly={props.isReadOnly || undefined}
		aria-busy={props.isLoading || undefined}
		className={[
			'vx-inputnumber',
			props.isDisabled ? 'vx-inputnumber--disabled' : undefined,
			props.isReadOnly ? 'vx-inputnumber--readonly' : undefined,
			props.isLoading ? 'vx-inputnumber--loading' : undefined,
			props.status ? `vx-inputnumber--status-${props.status.type}` : undefined,
			`vx-inputnumber--size-${size}`,
			props.className,
		]}
		style={props.style}
	>
		{showSteppers ? (
			<Pressable
				className="vx-inputnumber-step"
				disabled={isBlocked}
				onPress={() => stepBy(-1)}
				accessibilityLabel="Decrement"
			>
				<span>−</span>
			</Pressable>
		) : null}
		<TextInput
			className="vx-inputnumber-field"
			keyboardType="decimal"
			isDisabled={props.isDisabled}
			isReadOnly={props.isReadOnly}
			placeholder={props.placeholder}
			value={display}
			onChange={(text: string) => {
				const n = parseFloat(text)
				if (text === '') {
					setValue(null)
				} else if (!isNaN(n)) {
					setValue(clamp(n))
				}
			}}
		/>
		{props.units != null ? (
			<span className="vx-inputnumber-units" aria-hidden="true">
				{props.units}
			</span>
		) : null}
		{showSteppers ? (
			<Pressable
				className="vx-inputnumber-step"
				disabled={isBlocked}
				onPress={() => stepBy(1)}
				accessibilityLabel="Increment"
			>
				<span>+</span>
			</Pressable>
		) : null}
		{props.hasClear && value != null && !isBlocked ? (
			<button
				type="button"
				className="vx-inputnumber-clear"
				aria-label="Clear value"
				onClick={clear}
			>
				{'×'}
			</button>
		) : null}
	</div>
}
