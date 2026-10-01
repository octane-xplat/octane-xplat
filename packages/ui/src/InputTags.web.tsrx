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
	const isBlocked = props.isDisabled || props.isReadOnly;

	const setTags = (next: string[]) => {
		if (!controlled) setInternal(next);
		props.onValueChange?.(next);
	};

	const commit = () => {
		if (isBlocked) return;
		const tag = text.trim();
		if (!tag || (props.max != null && tags.length >= props.max)) return;
		setTags([...tags, tag]);
		setText('');
	};

	const removeAt = (i: number) => {
		if (!isBlocked) setTags(tags.filter((_, k) => k !== i));
	};

	<div ref={(e: any) => applyEscapeProps(e, props)} id={props.id} aria-disabled={props.isDisabled || undefined} aria-readonly={props.isReadOnly || undefined} aria-busy={props.isLoading || undefined} aria-required={props.isRequired && !props.isOptional || undefined} aria-invalid={props.status?.type === 'error' || undefined} className={['vx-inputtags', props.isDisabled ? 'vx-inputtags--disabled' : undefined, props.isReadOnly ? 'vx-inputtags--readonly' : undefined, props.isLoading ? 'vx-inputtags--loading' : undefined, props.status ? `vx-inputtags--status-${props.status.type}` : undefined, props.size ? `vx-inputtags--size-${props.size}` : undefined, props.className]} style={props.style}>
		{tags.map((tag: string, i: number) => (
			<span key={tag + i} className="vx-inputtags-tag">
				<span className="vx-inputtags-tag-label">{tag}</span>
				<Pressable className="vx-inputtags-remove" disabled={isBlocked} onPress={() => removeAt(i)} accessibilityLabel={'Remove ' + tag}>
					<span aria-hidden="true">✕</span>
				</Pressable>
			</span>
		))}
		<TextInput
			className="vx-inputtags-field"
			placeholder={props.placeholder}
			isDisabled={props.isDisabled}
			isReadOnly={props.isReadOnly}
			isLoading={props.isLoading}
			value={text}
			onChange={setText}
			onSubmit={commit}
			web={{ onkeydown: (e: any) => { if (e.key === 'Backspace' && text === '') removeAt(tags.length - 1); } }}
		/>
	</div>
}
