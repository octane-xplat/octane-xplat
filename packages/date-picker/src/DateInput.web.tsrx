/** @jsxImportSource octane */
import { useState } from 'octane'
import type { DateInputProps } from './web/types'

/** Renders a labeled browser date/time input. */
export function DateInput(props: DateInputProps) @{
	const controlled = props.value !== undefined
	const [internalValue, setInternalValue] = useState(props.defaultValue ?? '')
	const value = controlled ? props.value! : internalValue
	const labelId = props.id ? `${props.id}-label` : undefined

	<label className={props.className} style={props.style}>
		<span id={labelId}>{props.label}</span>
		<input
			id={props.id}
			type={props.type ?? 'date'}
			aria-label={props.accessibilityLabel ?? props.label}
			aria-labelledby={labelId}
			value={value}
			min={props.min}
			max={props.max}
			disabled={props.disabled}
			onChange={(event: any) => {
				const nextValue = event.target.value as string
				if (!controlled) setInternalValue(nextValue)
				props.onChange?.(nextValue)
			}}
		/>
	</label>
}
