/** @jsxImportSource @nativescript-community/octane */
import type { TextInputProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";

/** Controlled single-line input. The driver suppresses the textChange echo
 *  of its own `text` writes (upstream #5, since 0.2.1) — no leaf-side
 *  guard needed. */
export function TextInput(props: TextInputProps) @{
	<textfield
		ref={(v: any) => {
			if (!v) return;
			applyEscapeProps(v, props);
			props.bind?.({ focus: () => v.focus(), blur: () => v.dismissSoftInput?.() ?? v.blur(), native: v });
		}}
		id={props.id}
		className={cx(props.className)}
		style={{ ...props.style, ...(props.placeholderTextColor ? { placeholderColor: props.placeholderTextColor } : {}) }}
		text={props.value}
		hint={props.placeholder ?? props.hint}
		secure={props.secure}
		keyboardType={props.keyboardType === 'default' ? undefined : props.keyboardType}
		returnKeyType={props.returnKeyType}
		editable={props.editable}
		onTextChange={(e: any) => props.onChange?.(e.value)}
		onReturnPress={props.onSubmit}
		onFocus={props.onFocus}
		onBlur={props.onBlur}
	/>
}
