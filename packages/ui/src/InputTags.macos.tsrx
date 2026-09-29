/** @jsxImportSource @xplat/macos/renderer */
import { useState } from 'octane';
import type { InputTagsProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { TextInput } from './text-controls.macos.tsrx';
import { Pressable } from './Pressable.macos.tsrx';

/** InputTags — committed chips + a trailing normalized TextInput. Enter
 *  commits the field as a tag; each chip carries an ✕ remove affordance. */
export function InputTags(props: InputTagsProps) @{
	const [internal, setInternal] = useState<string[]>(props.defaultValue ?? []);
	const controlled = props.value !== undefined;
	const tags = controlled ? props.value! : internal;
	const [text, setText] = useState('');

	const setTags = (next: string[]) => {
		if (!controlled) setInternal(next);
		props.onValueChange?.(next);
	};

	const commit = () => {
		const tag = text.trim();
		if (!tag || (props.max != null && tags.length >= props.max)) return;
		setTags([...tags, tag]);
		setText('');
	};

	const removeAt = (i: number) => setTags(tags.filter((_, k) => k !== i));

	<flexboxlayout ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-inputtags', props.disabled && 'vx-inputtags--disabled', props.className)} style={props.style}>
		@for (const e of tags.map((tag, i) => ({ tag, i })); key e.tag + e.i) {
			<flexboxlayout className="vx-inputtags-tag">
				<label className="vx-inputtags-tag-label" text={e.tag} />
				<Pressable className="vx-inputtags-remove" disabled={props.disabled} onPress={() => removeAt(e.i)} accessibilityLabel={'Remove ' + e.tag}>
					<label text="✕" />
				</Pressable>
			</flexboxlayout>
		}
		<TextInput
			className="vx-inputtags-field"
			placeholder={props.placeholder}
			editable={!props.disabled}
			value={text}
			onChange={setText}
			onSubmit={commit}
		/>
	</flexboxlayout>
}
