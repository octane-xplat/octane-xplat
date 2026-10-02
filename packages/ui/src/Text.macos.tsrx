/** @jsxImportSource @octane-xplat/macos-renderer */
import type { RichTextProps, RichTextSpanProps, TextProps } from './props'

export function Text(props: TextProps) @{
	<label id={props.id} className={props.className} style={props.style} accessibilityLabel={props.accessibilityLabel} accessibilityRole={props.accessibilityRole}>
		{props.children}
	</label>
}

export function RichText(props: RichTextProps) @{
	<label id={props.id} className={props.className} style={props.style} accessibilityLabel={props.accessibilityLabel}>
		{props.children}
	</label>
}

export function RichTextSpan(props: RichTextSpanProps) @{
	<span className={props.className} style={props.style}>{props.children}</span>
}
