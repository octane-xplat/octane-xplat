import { useEffect, useRef, useState } from 'octane';
import type { PinInputProps, TextInputHandle } from "./props";
import { applyEscapeProps } from "./escape-props";
import { TextInput } from './TextInput.web.tsrx';

/** PinInput — a row of single-character cells that auto-advance on entry.
 *  `onComplete` fires when every cell is filled. `secure` masks each cell. */
export function PinInput(props: PinInputProps) @{
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
		if (props.disabled || i > value.length) return;
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

	<div ref={(e: any) => applyEscapeProps(e, props)} id={props.id} className={['vx-pininput', props.disabled ? 'vx-pininput--disabled' : undefined, props.className]} style={props.style} role="group">
		{Array.from({ length }, (_, i) => (
			<TextInput
				key={i}
				className="vx-pininput-cell"
				keyboardType="number"
				secure={props.secure}
				editable={!props.disabled && i <= value.length}
				value={cellValue(i)}
				onChange={(text: string) => enter(i, text)}
				bind={(h: TextInputHandle) => { handles.current[i] = h; }}
			/>
		))}
	</div>
}
