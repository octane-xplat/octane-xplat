/** @jsxImportSource @nativescript-community/octane */

/** Controlled single-line input. `text` write-back vs cursor/IME behavior is
 *  the experiment this leaf exists to probe. */
export function TextInput(props: {
  className?: any;
  style?: any;
  value?: string;
  placeholder?: string;
  hint?: string;
  onChange?: (value: string) => void;
}) @{
	<textfield
		className={props.className}
		style={props.style}
		text={props.value}
		hint={props.placeholder ?? props.hint}
		onTextChange={(e: any) => props.onChange?.(e.value)}
	/>
}
