/** @jsxImportSource @octane-xplat/macos-renderer */
import type { RichTextProps, RichTextSpanProps, TextProps } from './props'
import { cx } from '@octane-xplat/lib'

export function Text(props: TextProps) @{
	<label id={props.id} className={cx(props.className)} style={props.style as any} accessibilityLabel={props.accessibilityLabel} accessibilityRole={props.accessibilityRole}>
		{props.children}
	</label>
}

export function RichText(props: RichTextProps) @{
	<label id={props.id} className={cx(props.className)} style={props.style as any} accessibilityLabel={props.accessibilityLabel}>
		{props.children}
	</label>
}

export function RichTextSpan(props: RichTextSpanProps) @{
	<span className={cx(props.className)} style={props.style}>{props.children}</span>
}
