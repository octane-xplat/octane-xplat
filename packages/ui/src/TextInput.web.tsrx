export function TextInput(props: {
  className?: any;
  style?: any;
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
}) @{
	<input
		className={props.className}
		style={props.style}
		value={props.value}
		placeholder={props.placeholder}
		onInput={(e: any) => props.onChange?.(e.target.value)}
	/>
}
