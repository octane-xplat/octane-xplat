/** @jsxImportSource @octane-xplat/jsx/dom */
import { useState } from 'octane'
import type { SelectProps } from './web/types'

/** Renders a labeled browser select. */
export function Select(props: SelectProps) @{
	const controlled = props.value !== undefined
	const [internalValue, setInternalValue] = useState(
		props.defaultValue ?? props.options[0]?.value ?? '',
	)

	// Uncontrolled with a blank internal selection displays the first option
	// once options exist — the default is auto-select-first.
	const value = controlled ? props.value! : internalValue || (props.options[0]?.value ?? '')

	<label className={props.className} style={props.style}>
		{/* The wrapping <label> supplies the implicit accessible name;
		    aria-label overrides it with accessibilityLabel when given. */}
		<span>{props.label}</span>
		<select
			id={props.id}
			aria-label={props.accessibilityLabel ?? props.label}
			value={value}
			disabled={props.disabled}
			onChange={(event: any) => {
				const nextValue = event.target.value as string
				if (!controlled) {
					setInternalValue(nextValue)
				}

				props.onChange?.(nextValue)
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
