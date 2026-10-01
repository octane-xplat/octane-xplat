import { useState } from 'octane';
import type { InputNumberProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { TextInput } from './TextInput.web.tsrx';
import { Pressable } from './Pressable.web.tsrx';

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

	<div ref={(e: any) => applyEscapeProps(e, props)} id={props.id} aria-disabled={props.isDisabled || undefined} aria-readonly={props.isReadOnly || undefined} aria-busy={props.isLoading || undefined} className={['vx-inputnumber', props.isDisabled ? 'vx-inputnumber--disabled' : undefined, props.isReadOnly ? 'vx-inputnumber--readonly' : undefined, props.isLoading ? 'vx-inputnumber--loading' : undefined, props.status ? `vx-inputnumber--status-${props.status.type}` : undefined, props.size ? `vx-inputnumber--size-${props.size}` : undefined, props.className]} style={props.style}>
		<Pressable className="vx-inputnumber-step" disabled={isBlocked} onPress={() => stepBy(-1)} accessibilityLabel="Decrement">
			<span>−</span>
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
			<span>+</span>
		</Pressable>
	</div>
}
