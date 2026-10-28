/** @jsxImportSource @octane-xplat/jsx */
import { AccessibilityRole } from '@nativescript/core'
import type { HeadingProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyNativeProps } from './platformProps'
import { useTheme } from './theme/use-theme'
import { headingScaleStyle } from './text-scale'
import { styleRecord } from './style-merge'

/**
 * Semantic heading (level 1–6). Import from `@octane-xplat/ui`.
 *
 * @see HeadingProps.
 */
export function Heading(props: HeadingProps) @{
	const level = props.level ?? 2
	const theme = useTheme()
	const scale = headingScaleStyle(theme.tokens, props)
	const maxLines = props.maxLines ?? 0

	const headingStyle = {
		...(scale.fontSizePx != null && { fontSize: scale.fontSizePx }),
		...(scale.fontWeight && { fontWeight: scale.fontWeight }),
		...(scale.lineHeightPx != null && { lineHeight: scale.lineHeightPx }),
		...(scale.color && { color: scale.color }),
		...(maxLines > 0 && { flexShrink: 1 }),
		...styleRecord(props.style),
	}

	<label
		id={props.id}
		className={cx(
			'vx-heading',
			`vx-h${level}`,
			props.type && `vx-heading--${props.type}`,
			props.className,
		)}
		style={headingStyle}
		maxLines={maxLines}
		whiteSpace={maxLines === 1 ? 'nowrap' : 'normal'}
		textOverflow={maxLines > 0 ? 'ellipsis' : undefined}
		accessibilityRole={AccessibilityRole.Header}
		ref={(el: any) => applyNativeProps(el, props)}
	>
		{props.children}
	</label>
}
