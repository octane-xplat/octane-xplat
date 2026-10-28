/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from './style-merge'
import type { HeadingProps, MeterProps } from './props'
import { cx } from '@octane-xplat/lib'
import { meterRange } from './meter-math'
import { useTheme } from './theme/use-theme'
import { headingScaleStyle } from './text-scale'

export function Meter(props: MeterProps) @{
	const min = props.minValue ?? 0
	const max = props.maxValue ?? props.max ?? 100
	const { max: rangeMax, value } = meterRange(props.value, min, max)
	const size = props.size ?? 24
	const strokeWidth = Math.max(0, Math.min(props.strokeWidth ?? 3, size))

	// Track ring via layer chrome; the progress arc itself needs a stroked
	// CAShapeLayer — not bridged yet, so the ring renders unfilled.

	<masonview
		id={props.id}
		className={cx('vx-meter', props.className)}
		style={mergeStyle(
			{ display: 'flex' },
			{
				width: size,
				height: size,
				borderWidth: strokeWidth,
				borderColor: props.trackColor ?? '#e1ecf7',
				borderRadius: size / 2,
				...styleRecord(props.style),
			},
		)}
		accessibilityRole="meter"
		accessibilityLabel={props.accessibilityLabel}
		accessibilityValue={String(value)}
		accessibilityMinValue={min}
		accessibilityMaxValue={rangeMax}
		accessibilityValueDescription={props.valueLabel ?? `${value} of ${rangeMax}`}
	>
		{props.children}
	</masonview>
}

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
