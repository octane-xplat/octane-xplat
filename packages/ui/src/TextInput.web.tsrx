import type { TextInputProps } from "./props";
export function TextInput(props: TextInputProps) @{
	<input
		id={props.id}
		className={props.className}
		style={props.style}
		value={props.value}
		placeholder={props.placeholder ?? props.hint}
		onInput={(e: any) => props.onChange?.(e.target.value)}
	/>
}
