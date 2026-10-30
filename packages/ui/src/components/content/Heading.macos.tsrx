/** @jsxImportSource @octane-xplat/jsx */
import { AppKitTextScope } from '../forms/text-context.macos.tsrx'
import type { HeadingProps } from '../../props'
import { mergeStyle } from '../../internal/layout/style-merge'
import { cx } from '@octane-xplat/lib'
import { useTheme } from '../../theme/use-theme'
import { headingScaleStyle } from '../forms/text-scale'

export function Heading(props: HeadingProps): unknown @{
	const level = props.level ?? 2
	const theme = useTheme()
	const scale = headingScaleStyle(theme.tokens, props)
	const maxLines = props.maxLines ?? 0
	const headingStyle = mergeStyle(
		{
			...(scale.fontSizePx != null && { fontSize: scale.fontSizePx }),
			...(scale.fontWeight && { fontWeight: scale.fontWeight }),
			...(scale.lineHeightPx != null && { lineHeight: scale.lineHeightPx }),
			...(scale.color && { color: scale.color }),
		},
		props.style,
	)

	<label
		id={props.id}
		className={cx(
			'vx-heading',
			`vx-h${level}`,
			props.type && `vx-heading--${props.type}`,
			props.className,
		)}
		style={headingStyle}
		maxLines={maxLines > 0 ? maxLines : undefined}
		whiteSpace={maxLines === 1 ? 'nowrap' : undefined}
		textOverflow={maxLines > 0 ? 'ellipsis' : undefined}
		accessibilityRole="heading"
		accessibilityHeadingLevel={level}
	>
		<AppKitTextScope>{props.children}</AppKitTextScope>
	</label>
}
