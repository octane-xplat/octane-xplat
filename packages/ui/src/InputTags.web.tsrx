import { useState } from 'octane';
import type { InputTagsProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { TextInput } from './TextInput.web.tsrx';
import { Pressable } from './Pressable.web.tsrx';

/** InputTags — committed chips + a trailing normalized TextInput. Enter
 *  commits the field as a tag; each chip carries an ✕ remove affordance;
 *  Backspace on an empty field removes the last tag (web). */
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

	<div ref={(e: any) => applyEscapeProps(e, props)} id={props.id} className={['vx-inputtags', props.disabled ? 'vx-inputtags--disabled' : undefined, props.className]} style={props.style}>
		{tags.map((tag: string, i: number) => (
			<span key={tag + i} className="vx-inputtags-tag">
				<span className="vx-inputtags-tag-label">{tag}</span>
				<Pressable className="vx-inputtags-remove" disabled={props.disabled} onPress={() => removeAt(i)} accessibilityLabel={'Remove ' + tag}>
					<span aria-hidden="true">✕</span>
				</Pressable>
			</span>
		))}
		<TextInput
			className="vx-inputtags-field"
			placeholder={props.placeholder}
			editable={!props.disabled}
			value={text}
			onChange={setText}
			onSubmit={commit}
			web={{ onkeydown: (e: any) => { if (e.key === 'Backspace' && text === '') removeAt(tags.length - 1); } }}
		/>
	</div>
}
