/** @jsxImportSource @nativescript-community/octane */
import { TextSlot } from './text-slot';
import type { BlockquoteProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';

/** Blockquote — quoted content with an inline-start rule and secondary text.
 *  String children render through a label so bare text works; component
 *  children are placed as-is. `cite` renders as a smaller attribution line. */
export function Blockquote(props: BlockquoteProps) @{
	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-blockquote', props.className)}
		style={props.style}
		flexDirection="column"
	>
		<TextSlot className="vx-blockquote-text">{props.children}</TextSlot>
		{props.cite != null && props.cite !== false
			? typeof props.cite === 'string' || typeof props.cite === 'number'
				? <label className="vx-blockquote-cite" whiteSpace="normal">{props.cite}</label>
				: props.cite
			: null}
	</flexboxlayout>
}
