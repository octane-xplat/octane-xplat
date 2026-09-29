/** @jsxImportSource @xplat/macos/renderer */
import { useState } from 'octane';
import type { PinInputProps, TextInputHandle } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { TextInput } from './text-controls.macos.tsrx';

/** PinInput — a row of single-character cells that auto-advance on entry.
 *  `onComplete` fires when every cell is filled. `secure` masks each cell. */
export function PinInput(props: PinInputProps) @{
	const length = props.length ?? 4;
	const [internal, setInternal] = useState('');
	const controlled = props.value !== undefined;
	const value = controlled ? props.value! : internal;
	const handles: (TextInputHandle | null)[] = [];

	const setValue = (next: string) => {
		const clipped = next.slice(0, length);
		if (!controlled) setInternal(clipped);
		props.onValueChange?.(clipped);
		if (clipped.length === length) props.onComplete?.(clipped);
	};

	const cellValue = (i: number) => value[i] ?? '';

	const enter = (i: number, text: string) => {
		const ch = text.slice(-1);
		const next = (value.slice(0, i) + ch + value.slice(i + 1)).slice(0, length);
		setValue(next);
		if (ch && i < length - 1) handles[i + 1]?.focus();
	};

	<flexboxlayout ref={(v: any) => applyEscapeProps(v, props)} id={props.id} flexDirection="row" className={cx('vx-pininput', props.disabled && 'vx-pininput--disabled', props.className)} style={props.style}>
		@for (const i of Array.from({ length }, (_, k) => k); key i) {
			<TextInput
				className="vx-pininput-cell"
				keyboardType="number"
				secure={props.secure}
				editable={!props.disabled}
				value={cellValue(i)}
				onChange={(text: string) => enter(i, text)}
				bind={(h: TextInputHandle) => { handles[i] = h; }}
			/>
		}
	</flexboxlayout>
}
