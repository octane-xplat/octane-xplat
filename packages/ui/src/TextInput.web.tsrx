import type { TextInputProps } from "./props";
import { applyEscapeProps } from "./escape-props";
export function TextInput(props: TextInputProps) @{
	const keyboardType = props.keyboardType === 'phone' ? 'tel' : props.keyboardType === 'default' ? 'text' : props.keyboardType;
	const inputMode = props.keyboardType === 'number' ? 'numeric' : props.keyboardType === 'phone' ? 'tel' : props.keyboardType === 'default' ? 'text' : props.keyboardType;
	<input
		ref={(el: any) => {
			if (!el) return;
			applyEscapeProps(el, props);
			props.bind?.({ focus: () => el.focus(), blur: () => el.blur(), native: el });
		}}
		id={props.id}
		className={props.className}
		style={{ ...props.style, ...(props.placeholderTextColor ? { '--placeholder-color': props.placeholderTextColor } : {}) }}
		value={props.value}
		type={props.secure ? 'password' : props.keyboardType === 'number' || props.keyboardType === 'decimal' ? 'number' : keyboardType}
		inputMode={inputMode}
		enterKeyHint={props.returnKeyType}
		readOnly={props.editable === false}
		placeholder={props.placeholder ?? props.hint}
		onInput={(e: any) => props.onChange?.(e.target.value)}
		onKeyDown={(e: any) => { if (e.key === 'Enter' && !e.shiftKey) props.onSubmit?.(); }}
		onFocus={props.onFocus}
		onBlur={props.onBlur}
	/>
}
