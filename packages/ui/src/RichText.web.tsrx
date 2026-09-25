import type { RichTextProps, RichTextSpanProps } from './props';
import { applyEscapeProps } from './escape-props';
import { layoutChildProps } from './layout-child.web';

export function RichText(props: RichTextProps) @{
	<span
		id={props.id}
		ref={(el: any) => applyEscapeProps(el, props)}
		className={['vx-rich-text', props.className]}
		{...layoutChildProps(props, props.style)}
	>
		{props.children}
	</span>
}

export function RichTextSpan(props: RichTextSpanProps) @{
	<span
		className={props.className}
		style={props.style}
		onClick={() => props.onPress?.()}
	>
		{props.text ?? props.children}
	</span>
}
