/** @jsxImportSource @octane-xplat/macos-renderer */
import type { RichTextProps, RichTextSpanProps, TextProps } from './props'
import { styleRecord } from './style-merge'
import { cx } from '@octane-xplat/lib'
import { useTheme } from './theme/use-theme'
import { textScaleStyle } from './text-scale'

export function Text(props: TextProps) @{
	const theme = useTheme()
	const scale = textScaleStyle(theme.tokens, props)
	const maxLines = props.maxLines ?? 0
	const textStyle = {
		...(scale.fontSizePx != null && { fontSize: scale.fontSizePx }),
		...(scale.fontWeight && { fontWeight: scale.fontWeight }),
		...(scale.lineHeightPx != null && { lineHeight: scale.lineHeightPx }),
		...(scale.fontFamily && { fontFamily: scale.fontFamily }),
		...(scale.color && { color: scale.color }),
		...styleRecord(props.style),
	}

	<label
		id={props.id}
		className={cx(
			'vx-text',
			props.type && `vx-text--${props.type}`,
			props.size && `vx-text--size-${props.size}`,
			props.color && `vx-text--color-${props.color}`,
			props.className,
		)}
		style={textStyle}
		maxLines={maxLines > 0 ? maxLines : undefined}
		whiteSpace={maxLines === 1 ? 'nowrap' : undefined}
		textOverflow={maxLines > 0 ? 'ellipsis' : undefined}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={props.accessibilityRole}
	>
		{props.children}
	</label>
}

export function RichText(props: RichTextProps) @{
	<label
		id={props.id}
		className={cx(props.className)}
		style={styleRecord(props.style)}
		accessibilityLabel={props.accessibilityLabel}
	>
		{props.children}
	</label>
}

export function RichTextSpan(props: RichTextSpanProps) @{
	<span className={cx(props.className)} style={styleRecord(props.style)}>
		{props.children}
	</span>
}
