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

	<flexboxlayout ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-inputtags', props.isDisabled && 'vx-inputtags--disabled', props.isReadOnly && 'vx-inputtags--readonly', props.isLoading && 'vx-inputtags--loading', props.status && `vx-inputtags--status-${props.status.type}`, props.size && `vx-inputtags--size-${props.size}`, props.className)} style={props.style} accessibilityState={{ disabled: props.isDisabled, readonly: props.isReadOnly, busy: props.isLoading, required: props.isRequired && !props.isOptional, invalid: props.status?.type === 'error' }}>
		@for (const e of tags.map((tag, i) => ({ tag, i })); key e.tag + e.i) {
			<flexboxlayout className="vx-inputtags-tag">
				<label className="vx-inputtags-tag-label" text={e.tag} />
				<Pressable className="vx-inputtags-remove" disabled={isBlocked} onPress={() => removeAt(e.i)} accessibilityLabel={'Remove ' + e.tag}>
					<label text="✕" />
				</Pressable>
			</flexboxlayout>
		}
		<TextInput
			className="vx-inputtags-field"
			placeholder={props.placeholder}
			isDisabled={props.isDisabled}
			isReadOnly={props.isReadOnly}
			isLoading={props.isLoading}
			value={text}
			onChange={setText}
			onSubmit={commit}
		/>
	</flexboxlayout>
}
