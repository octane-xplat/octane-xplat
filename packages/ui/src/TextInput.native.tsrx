/** @jsxImportSource @nativescript-community/octane */
import type { TextInputProps } from "./props";

/** Controlled single-line input. The driver suppresses the textChange echo
 *  of its own `text` writes (upstream #5, since 0.2.1) — no leaf-side
 *  guard needed. */
export function TextInput(props: TextInputProps) @{
	<textfield
		id={props.id}
		className={props.className}
		style={props.style}
		text={props.value}
		hint={props.placeholder ?? props.hint}
		onTextChange={(e: any) => props.onChange?.(e.value)}
	/>
}
