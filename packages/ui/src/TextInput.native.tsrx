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
		id="probe-input"
		className={props.className}
		style={props.style}
		text={props.value}
		hint={props.placeholder ?? props.hint}
		onTextChange={(e: any) => {
			// Programmatic `text` writes echo back as textChange (measured:
			// one notify → two onChange calls — event + write-back echo).
			// The echo's e.value equals the committed value — drop it.
			if (e.value !== props.value) props.onChange?.(e.value);
		}}
	/>
}
