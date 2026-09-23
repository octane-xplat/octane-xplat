/** @jsxImportSource @nativescript-community/octane */

/** Controlled single-line input. The driver suppresses the textChange echo
 *  of its own `text` writes (pnpm patch) — no leaf-side guard needed. */
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
		onTextChange={(e: any) => props.onChange?.(e.value)}
	/>
}
