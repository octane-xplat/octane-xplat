import type { TextProps } from './props'
import { styleRecord } from './style-merge'
import { applyEscapeProps } from './escape-props'
import { layoutChildProps } from './layout-child.web'
import { useTheme } from './theme/use-theme'
import { textScaleStyle } from './text-scale'
import { cx } from '@octane-xplat/lib'
export function Text(props: TextProps) @{
	const theme = useTheme()
	const scale = textScaleStyle(theme.tokens, props)
	const maxLines = props.maxLines ?? 0
	const textStyle = {
		// The type scale is the baseline; `style` overrides it per prop.
		...(scale.fontSize && { fontSize: scale.fontSize }),
		// Unitless string leading survives normStyle untouched — a number
		// would be forced to px (see layout-child.web.ts).
		...(scale.lineHeight && { lineHeight: scale.lineHeight }),
		...(scale.fontWeight && { fontWeight: scale.fontWeight }),
		...(scale.fontFamily && { fontFamily: scale.fontFamily }),
		...(scale.color && { color: scale.color }),
		// Astryx truncation: 1 = single-line ellipsis, >1 = line-clamp.
		// Clamped text must be allowed to shrink — the shared shrink:0 default
		// would let it overflow its row instead of truncating.
		...(maxLines === 1
			? {
					display: 'block',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap',
					wordBreak: 'break-all',
					flexShrink: 1,
				}
			: maxLines > 1
				? {
						display: '-webkit-box',
						WebkitBoxOrient: 'vertical',
						WebkitLineClamp: maxLines,
						overflow: 'hidden',
						wordBreak: 'normal',
						overflowWrap: 'break-word',
						flexShrink: 1,
					}
				: {}),
		...styleRecord(props.style),
	}

	<span
		id={props.id}
		data-testid={props.testID}
		ref={(el: any) => applyEscapeProps(el, props)}
		className={cx(
			'vx-text',
			props.type && `vx-text--${props.type}`,
			props.size && `vx-text--size-${props.size}`,
			props.color && `vx-text--color-${props.color}`,
			props.className,
		)}
		{...layoutChildProps(props, textStyle)}
		role={props.accessibilityRole}
		aria-label={props.accessibilityLabel}
		aria-hidden={props.accessible === false ? true : undefined}
		aria-description={props.accessibilityHint}
		aria-valuetext={props.accessibilityValue}
		aria-disabled={props.accessibilityState?.disabled}
		aria-selected={props.accessibilityState?.selected}
		aria-checked={props.accessibilityState?.checked}
		aria-live={props.accessibilityLiveRegion === 'none' ? 'off' : props.accessibilityLiveRegion}
	>
		{props.children}
	</span>
}
