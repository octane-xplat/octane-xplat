/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { useState } from 'octane'
import type { InputNumberProps } from './props'
import { useSize } from './size-context'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'
import { TextInput } from './text-controls.macos.tsrx'
import { Pressable } from './Pressable.macos.tsrx'

/** InputNumber — normalized number field with −/+ steppers. Controlled via
 *  `value`/`onValueChange`, uncontrolled via `defaultValue`. Steppers clamp
 *  to `min`/`max`. */
export function InputNumber(props: InputNumberProps) @{
	const size = useSize(props.size, 'md')
	const [internal, setInternal] = useState(props.defaultValue)
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
		id={props.id}
		className={cx(
			'vx-inputnumber',
			props.isDisabled && 'vx-inputnumber--disabled',
			props.isReadOnly && 'vx-inputnumber--readonly',
			props.isLoading && 'vx-inputnumber--loading',
			props.status && `vx-inputnumber--status-${props.status.type}`,
			`vx-inputnumber--size-${size}`,
			props.className,
		)}
		style={mergeStyle({ display: 'flex' }, props.style)}
		accessibilityState={{
			disabled: props.isDisabled,
			readonly: props.isReadOnly,
			busy: props.isLoading,
		}}
	>
		<Pressable
			className="vx-inputnumber-step"
			disabled={isBlocked}
			onPress={() => stepBy(-1)}
			accessibilityLabel="Decrement"
		>
			<label text="−" />
		</Pressable>
		<TextInput
			className="vx-inputnumber-field"
			keyboardType="decimal"
			isDisabled={props.isDisabled}
			isReadOnly={props.isReadOnly}
			placeholder={props.placeholder}
			value={value == null ? '' : String(value)}
			onChange={(text: string) => {
				const n = parseFloat(text)
				if (text === '') {
					setValue(null)
				} else if (!isNaN(n)) {
					setValue(clamp(n))
				}
			}}
		/>
		<Pressable
			className="vx-inputnumber-step"
			disabled={isBlocked}
			onPress={() => stepBy(1)}
			accessibilityLabel="Increment"
		>
			<label text="+" />
		</Pressable>
	</masonview>
}
