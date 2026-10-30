import type { HeadingProps } from '../../props'
import { normStyle } from '../layout/layout-child.web'
import { applyWebProps } from '../../internal/platform/platformProps.web'
import { useTheme } from '../../theme/use-theme'
import { headingScaleStyle } from '../forms/text-scale'
import { cx } from '@octane-xplat/lib'
import type { JSX } from 'octane/jsx-runtime'

export function Heading(props: HeadingProps): JSX.Element @{
	const level = props.level ?? 2
	const Tag = `h${level}` as const
	const theme = useTheme()
	const scale = headingScaleStyle(theme.tokens, props)
	const maxLines = props.maxLines ?? 0

	const headingStyle = {
		...(scale.fontSize && { fontSize: scale.fontSize }),
		// Unitless string leading survives normStyle untouched.
		...(scale.lineHeight && { lineHeight: scale.lineHeight }),
		...(scale.fontWeight && { fontWeight: scale.fontWeight }),
		...(scale.color && { color: scale.color }),
		...(maxLines === 1
			? {
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap',
					wordBreak: 'break-all',
				}
			: maxLines > 1
				? {
						display: '-webkit-box',
						WebkitBoxOrient: 'vertical',
						WebkitLineClamp: maxLines,
						overflow: 'hidden',
						wordBreak: 'normal',
						overflowWrap: 'break-word',
					}
				: {}),
		...normStyle(props.style),
	}

	<Tag
		id={props.id}
		className={cx(
			'vx-heading',
			`vx-h${level}`,
			props.type && `vx-heading--${props.type}`,
			props.className,
		)}
		style={headingStyle}
		ref={(el: any) => applyWebProps(el, props.web)}
	>
		{props.children}
	</Tag>
}
