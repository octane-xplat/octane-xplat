/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { cx } from '@octane-xplat/lib'
import type { MeterProps } from '../../props'
import { meterRange } from './meter-math'

export function Meter(props: MeterProps): unknown @{
	const min = props.minValue ?? 0
	const max = props.maxValue ?? props.max ?? 100
	const { min: rangeMin, max: rangeMax, value } = meterRange(props.value, min, max)
	const size = Number.isFinite(props.size) && props.size! > 0 ? props.size! : 24
	const strokeWidth = Math.max(
		0,
		Math.min(Number.isFinite(props.strokeWidth) ? props.strokeWidth! : 3, size),
	)

	// Preserve the existing track ring and caller content. A value arc still
	// needs a drawing path; this leaf does not paint measured progress.

	<masonview
		id={props.id}
		className={cx('vx-meter', props.className)}
		style={mergeStyle(
			{
				display: 'flex',
				width: size,
				height: size,
				borderWidth: strokeWidth,
				borderColor: props.trackColor ?? '#e1ecf7',
				borderRadius: size / 2,
			},
			props.style,
		)}
		accessibilityRole="meter"
		accessibilityLabel={props.accessibilityLabel}
		accessibilityValue={String(value)}
		accessibilityMinValue={rangeMin}
		accessibilityMaxValue={rangeMax}
		accessibilityValueDescription={props.valueLabel ?? `${value} of ${rangeMax}`}
	>
		{props.children}
	</masonview>
}
