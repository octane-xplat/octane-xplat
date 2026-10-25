/** @jsxImportSource @octane-xplat/macos-renderer */
import { useRef, useState } from 'octane';
import type { ColorFieldProps } from './props';
import { mergeStyle, styleRecord } from './style-merge'
import { cx } from '@octane-xplat/lib';
import { Text } from './Text.macos.tsrx';
import { TextInput } from './text-controls.macos.tsrx';
import { normalizeHex } from './color';
import { useColorState } from './color-state';

/** Hex text field — keeps a draft while editing; commits on submit/blur:
 *  valid input fires onChange + onChangeEnd, invalid restores the value. */
export function ColorField(props: ColorFieldProps) @{
	const color = useColorState(props);
	const draft = useRef<string | null>(null);
	const [, bump] = useState(0);

	const commit = () => {
		const text = draft.current;
		draft.current = null;
		if (text == null) return;
		const parsed = normalizeHex(text);
		if (parsed) {
			color.setHex(parsed);
			color.end();
		}
		bump((n) => n + 1); // drop the draft, restore current hex
	};

	<masonview className={cx('vx-color-field', props.className)} style={mergeStyle({display: "flex", flexDirection: 'row', gap: 8, alignItems: 'center'}, styleRecord(props.style))}>
		{props.label ? <Text className="vx-color-field-label">{props.label}</Text> : null}
		<TextInput
			id={props.id}
			className="vx-color-field-input"
			value={draft.current ?? color.hex}
			isDisabled={props.isDisabled}
			onChange={(v) => { draft.current = v; bump((n) => n + 1); }}
			onSubmit={commit}
			onBlur={commit}
			accessibilityLabel={props.accessibilityLabel ?? 'color'}
		/>
	</masonview>
}
