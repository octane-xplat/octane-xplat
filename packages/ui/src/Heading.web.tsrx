import type { HeadingProps } from './props'
import { normStyle } from './layout-child.web'
import { applyWebProps } from './platformProps.web'
import { useTheme } from './theme/use-theme'
import { headingScaleStyle } from './text-scale'
import { cx } from '@octane-xplat/lib'

export function Heading(props: HeadingProps) @{
	const level = props.level ?? 2
	const tag = `h${level}`
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

	<{tag}
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
	</{tag}>
}
