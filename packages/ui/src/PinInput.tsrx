/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef, useState } from 'octane';
import type { PinInputProps, TextInputHandle } from "./props";
import { cx } from "./cx";
import { applyEscapeProps, nativeAccessibilityState } from "./escape-props";
import { FieldProvider, useFieldControlProps } from './field-context';
import { TextInput } from './TextInput.tsrx';

/** PinInput — a row of single-character cells that auto-advance on entry.
 *  `onComplete` fires when every cell is filled. `secure` masks each cell. */
export function PinInput(props: PinInputProps) @{
	const fieldProps = useFieldControlProps(props);
	const length = props.length ?? 4;
	const [internal, setInternal] = useState('');
	const controlled = props.value !== undefined;
	const value = controlled ? props.value! : internal;
	const handles = useRef<(TextInputHandle | null)[]>([]);
	const pendingFocus = useRef<number | null>(null);
	useEffect(() => {
		const next = pendingFocus.current;
		if (next !== null && next <= value.length) {
			pendingFocus.current = null;
			handles.current[next]?.focus();
		}
	}, [value]);

	const setValue = (next: string) => {
		const clipped = next.slice(0, length);
		if (!controlled) setInternal(clipped);
		props.onValueChange?.(clipped);
		if (clipped.length === length) props.onComplete?.(clipped);
	};

	const cellValue = (i: number) => value[i] ?? '';

	const enter = (i: number, text: string) => {
		if (fieldProps.isDisabled || fieldProps.isReadOnly || i > value.length) return;
		const ch = text.slice(-1);
		const next = ch ? (value.slice(0, i) + ch + value.slice(i + 1)).slice(0, length) : value.slice(0, i);
		pendingFocus.current = ch && i < length - 1 ? i + 1 : null;
		setValue(next);
		if (pendingFocus.current !== null && pendingFocus.current <= value.length) {
			const index = pendingFocus.current;
			pendingFocus.current = null;
			handles.current[index]?.focus();
		}
	};

	<flexboxlayout ref={(v: any) => applyEscapeProps(v, fieldProps)} id={fieldProps.id} flexDirection="row" className={cx('vx-pininput', fieldProps.isDisabled && 'vx-pininput--disabled', fieldProps.isReadOnly && 'vx-pininput--readonly', fieldProps.isLoading && 'vx-pininput--loading', fieldProps.status && `vx-pininput--status-${fieldProps.status.type}`, fieldProps.size && `vx-pininput--size-${fieldProps.size}`, fieldProps.className)} style={fieldProps.style} accessibilityLabel={fieldProps.ariaLabel ?? fieldProps.fieldLabel} accessibilityHint={fieldProps.accessibilityHint} accessibilityState={nativeAccessibilityState({ disabled: fieldProps.isDisabled }) as any}>
		<FieldProvider value={null}>@for (const i of Array.from({ length }, (_, k) => k); key i) {
			<TextInput
				label={`${fieldProps.fieldLabel ?? fieldProps.ariaLabel ?? 'PIN'}, digit ${i + 1}`}
				className="vx-pininput-cell"
				keyboardType="number"
				secure={props.secure}
				isDisabled={fieldProps.isDisabled}
				isReadOnly={fieldProps.isReadOnly || i > value.length}
				isLoading={fieldProps.isLoading}
				isRequired={fieldProps.isRequired}
				isOptional={fieldProps.isOptional}
				size={fieldProps.size}
				status={fieldProps.status}
				value={cellValue(i)}
				onChange={(text: string) => enter(i, text)}
				bind={(h: TextInputHandle) => { handles.current[i] = h; }}
			/>
		}</FieldProvider>
	</flexboxlayout>
}
