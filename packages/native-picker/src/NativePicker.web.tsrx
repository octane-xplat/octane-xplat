/** @jsxImportSource octane */
import { useState } from 'octane'
import type { NativePickerProps } from './types'

/** Uses a browser select while preserving NativePicker's controlled-value contract. */
export function NativePicker(props: NativePickerProps) @{
	const controlled = props.value !== undefined
	const [internalValue, setInternalValue] = useState(props.defaultValue ?? props.options[0]?.value ?? '')
	const value = controlled ? props.value! : internalValue
	const labelId = props.id ? `${props.id}-label` : undefined
	const selectId = props.id
	<label className={props.className} style={props.style}>
		<span id={labelId}>{props.label}</span>
		<select
			id={selectId}
			aria-label={props.accessibilityLabel ?? props.label}
			aria-labelledby={labelId}
			value={value}
			disabled={props.disabled}
			onChange={(event: any) => {
				const nextValue = event.target.value as string
				if (!controlled) setInternalValue(nextValue)
				props.onValueChange?.(nextValue)
			}}
		>
			{props.options.map((option) => (
				<option key={option.value} value={option.value} disabled={option.disabled}>
					{option.label}
				</option>
			))}
		</select>
	</label>
}
