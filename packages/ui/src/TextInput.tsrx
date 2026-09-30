/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane';
import type { TextInputProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { isWritingText, writeText } from './text-write';
import { blurText } from './text-focus';

/** Controlled single-line input. Imperative writes suppress their synchronous
 *  textChange echo through text-write. `editable` defaults true: an undefined
 *  write coerces ios.userInteractionEnabled to NO (dead field) — the
 *  driver's skip-undefined patch covers it, the ?? stays as documentation.
 *  `text` isn't a bound prop: the leaf writes it imperatively so the
 *  Android selection survives controlled writes (see text-write). */
export function TextInput(props: TextInputProps) @{
	const el = useRef<any>(null);
	useEffect(() => writeText(el.current, props.value), [props.value]);

	<textfield
		ref={(v: any) => {
			el.current = v;
			if (!v) return;
			applyEscapeProps(v, props);
			props.bind?.({ focus: () => v.focus(), blur: () => blurText(v), native: v });
		}}
		id={props.id}
		className={cx('vx-input', props.className)}
		style={{ ...props.style, ...(props.placeholderTextColor ? { placeholderColor: props.placeholderTextColor } : {}) }}
		hint={props.placeholder}
		secure={props.secure}
		keyboardType={props.keyboardType === 'default' ? undefined : props.keyboardType}
		returnKeyType={props.returnKeyType}
		editable={props.editable ?? true}
		onTextChange={(e: any) => { if (!isWritingText(e.object)) props.onChange?.(e.value); }}
		onReturnPress={props.onSubmit}
		onFocus={props.onFocus}
		onBlur={props.onBlur}
	/>
}
