/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from './style-merge'
import type { HeadingProps } from './props'
import { cx } from '@octane-xplat/lib'
import { useTheme } from './theme/use-theme'
import { headingScaleStyle } from './text-scale'

export { Meter } from './Meter.macos.tsrx'

export function Heading(props: HeadingProps) @{
	const level = props.level ?? 2
	const theme = useTheme()
	const scale = headingScaleStyle(theme.tokens, props)
	const maxLines = props.maxLines ?? 0

	<label
		id={props.id}
		className={cx(
			'vx-heading',
			`vx-h${level}`,
			props.type && `vx-heading--${props.type}`,
			props.className,
		)}
		style={mergeStyle(
			{
				...(scale.fontSizePx != null && { fontSize: scale.fontSizePx }),
				...(scale.fontWeight && { fontWeight: scale.fontWeight }),
				...(scale.lineHeightPx != null && { lineHeight: scale.lineHeightPx }),
				...(scale.color && { color: scale.color }),
			},
			styleRecord(props.style),
		)}
		maxLines={maxLines > 0 ? maxLines : undefined}
		whiteSpace={maxLines === 1 ? 'nowrap' : undefined}
		textOverflow={maxLines > 0 ? 'ellipsis' : undefined}
		accessibilityRole="heading"
	>
		{props.children}
	</label>
}
