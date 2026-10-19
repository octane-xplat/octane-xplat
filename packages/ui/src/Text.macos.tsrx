/** @jsxImportSource @octane-xplat/macos-renderer */
import type { RichTextProps, RichTextSpanProps, TextProps } from './props'
import { styleRecord } from './style-merge'
import { cx } from '@octane-xplat/lib'

export function Text(props: TextProps) @{
	<label id={props.id} className={cx(props.className)} style={styleRecord(props.style)} accessibilityLabel={props.accessibilityLabel} accessibilityRole={props.accessibilityRole}>
		{props.children}
	</label>
}

export function RichText(props: RichTextProps) @{
	<label id={props.id} className={cx(props.className)} style={styleRecord(props.style)} accessibilityLabel={props.accessibilityLabel}>
		{props.children}
	</label>
}

export function RichTextSpan(props: RichTextSpanProps) @{
	<span className={cx(props.className)} style={styleRecord(props.style)}>{props.children}</span>
}
