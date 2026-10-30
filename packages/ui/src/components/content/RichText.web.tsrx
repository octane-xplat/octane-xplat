/** @jsxImportSource @octane-xplat/jsx/dom */
import type { RichTextProps, RichTextSpanProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { layoutChildProps } from '../layout/layout-child.web'
import type { JSX } from 'octane/jsx-runtime'

export function RichText(props: RichTextProps): JSX.Element @{
	<span
		id={props.id}
		ref={(el: any) => applyEscapeProps(el, props)}
		className={['vx-rich-text', props.className]}
		{...layoutChildProps(props, props.style)}
	>
		{props.children}
	</span>
}

export function RichTextSpan(props: RichTextSpanProps): JSX.Element @{
	<span className={props.className} style={props.style} onClick={() => props.onPress?.()}>
		{props.text ?? props.children}
	</span>
}
