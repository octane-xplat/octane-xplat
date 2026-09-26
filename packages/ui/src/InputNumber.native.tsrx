/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import type { InputNumberProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { TextInput } from './TextInput.native.tsrx';
import { Pressable } from './Pressable.native.tsrx';

/** InputNumber — normalized number field with −/+ steppers. Controlled via
 *  `value`/`onValueChange`, uncontrolled via `defaultValue`. Steppers clamp
 *  to `min`/`max`. */
export function InputNumber(props: InputNumberProps) @{
	const [internal, setInternal] = useState(props.defaultValue);
	const controlled = props.value !== undefined;
	const value = controlled ? props.value : internal;

	const clamp = (n: number) =>
		Math.min(props.max ?? Infinity, Math.max(props.min ?? -Infinity, n));

	const setValue = (n: number) => {
		if (!controlled) setInternal(n);
		props.onValueChange?.(n);
	};

	const stepBy = (dir: number) => {
		if (props.disabled) return;
		setValue(clamp((value ?? 0) + dir * (props.step ?? 1)));
	};

	<flexboxlayout ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-inputnumber', props.disabled && 'vx-inputnumber--disabled', props.className)} style={props.style}>
		<Pressable className="vx-inputnumber-step" disabled={props.disabled} onPress={() => stepBy(-1)} accessibilityLabel="Decrement">
			<label text="−" />
		</Pressable>
		<TextInput
			className="vx-inputnumber-field"
			keyboardType="decimal"
			editable={!props.disabled}
			placeholder={props.placeholder}
			value={value == null ? '' : String(value)}
			onChange={(text: string) => {
				const n = parseFloat(text);
				if (text === '' || !isNaN(n)) setValue(clamp(text === '' ? 0 : n));
			}}
		/>
		<Pressable className="vx-inputnumber-step" disabled={props.disabled} onPress={() => stepBy(1)} accessibilityLabel="Increment">
			<label text="+" />
		</Pressable>
	</flexboxlayout>
}
