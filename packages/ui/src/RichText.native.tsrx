/** @jsxImportSource @nativescript-community/octane */
import type { RichTextProps, RichTextSpanProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { layoutChildProps } from './layout-child.native';

/** Native rich text is a Label hosting one FormattedString. The driver knows
 * how to parent FormattedString → Span, while each run writes its text
 * directly because Span is not a TextBase host for #text children. */
export function RichText(props: RichTextProps) @{
	<label
		id={props.id}
		ref={(el: any) => applyEscapeProps(el, props)}
		{...layoutChildProps(props)}
		className={cx('vx-rich-text', props.className)}
		style={props.style}
		whiteSpace="normal"
	>
		<formattedstring>{props.children}</formattedstring>
	</label>
}

function runText(props: RichTextSpanProps): string {
	if (props.text !== undefined) return props.text;
	if (typeof props.children === 'string' || typeof props.children === 'number') {
		return String(props.children);
	}

	return '';
}

/** A FormattedString run. `onLinkTap` is NativeScript's per-span tap event. */
export function RichTextSpan(props: RichTextSpanProps) @{
	<span
		text={runText(props)}
		className={cx(props.className)}
		{...props.style}
		onLinkTap={props.onPress}
	/>
}
