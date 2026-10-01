/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import type { InputNumberProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps, nativeAccessibilityState } from "./escape-props";
import { TextInput } from './TextInput.tsrx';
import { Pressable } from './Pressable.tsrx';

/** InputNumber — normalized number field with −/+ steppers. Controlled via
 *  `value`/`onValueChange`, uncontrolled via `defaultValue`. Steppers clamp
 *  to `min`/`max`. */
export function InputNumber(props: InputNumberProps) @{
	const [internal, setInternal] = useState(props.defaultValue);
	const controlled = props.value !== undefined;
	const value = controlled ? props.value : internal;
	const isBlocked = props.isDisabled || props.isReadOnly;

	const clamp = (n: number) =>
		Math.min(props.max ?? Infinity, Math.max(props.min ?? -Infinity, n));

	const setValue = (n: number) => {
		if (isBlocked) return;
		if (!controlled) setInternal(n);
		props.onValueChange?.(n);
	};

	const stepBy = (dir: number) => {
		if (isBlocked) return;
		setValue(clamp((value ?? 0) + dir * (props.step ?? 1)));
	};

	<flexboxlayout ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-inputnumber', props.isDisabled && 'vx-inputnumber--disabled', props.isReadOnly && 'vx-inputnumber--readonly', props.isLoading && 'vx-inputnumber--loading', props.status && `vx-inputnumber--status-${props.status.type}`, props.size && `vx-inputnumber--size-${props.size}`, props.className)} style={props.style} accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled }) as any}>
		<Pressable className="vx-inputnumber-step" disabled={isBlocked} onPress={() => stepBy(-1)} accessibilityLabel="Decrement">
			<label text="−" />
		</Pressable>
		<TextInput
			className="vx-inputnumber-field"
			keyboardType="decimal"
			isDisabled={props.isDisabled}
			isReadOnly={props.isReadOnly}
			placeholder={props.placeholder}
			value={value == null ? '' : String(value)}
			onChange={(text: string) => {
				const n = parseFloat(text);
				if (text === '' || !isNaN(n)) setValue(clamp(text === '' ? 0 : n));
			}}
		/>
		<Pressable className="vx-inputnumber-step" disabled={isBlocked} onPress={() => stepBy(1)} accessibilityLabel="Increment">
			<label text="+" />
		</Pressable>
	</flexboxlayout>
}
