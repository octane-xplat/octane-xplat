/** @jsxImportSource @octane-xplat/macos-renderer */
import type { HeadingProps, MeterProps } from './props'
import { cx } from '@octane-xplat/lib'
import { meterRange } from './meter-math'

export function Meter(props: MeterProps) @{
	const min = props.minValue ?? 0
	const max = props.maxValue ?? props.max ?? 100
	const { max: rangeMax, value } = meterRange(props.value, min, max)
	const size = props.size ?? 24
	const strokeWidth = Math.max(0, Math.min(props.strokeWidth ?? 3, size))

	// Track ring via layer chrome; the progress arc itself needs a stroked
	// CAShapeLayer — not bridged yet, so the ring renders unfilled.
	<flexboxlayout
		id={props.id}
		className={cx('vx-meter', props.className)}
		style={{
			width: size,
			height: size,
			borderWidth: strokeWidth,
			borderColor: props.trackColor ?? '#e1ecf7',
			borderRadius: size / 2,
			...(props.style as any),
		}}
		accessibilityRole="meter"
		accessibilityLabel={props.accessibilityLabel}
		accessibilityValue={value}
		accessibilityMinValue={min}
		accessibilityMaxValue={rangeMax}
		accessibilityValueDescription={props.valueLabel ?? `${value} of ${rangeMax}`}
	>
		{props.children}
	</flexboxlayout>
}

export function Heading(props: HeadingProps) @{
	const level = props.level ?? 2

	<label
		id={props.id}
		className={cx('vx-heading', `vx-h${level}`, props.className)}
		style={props.style as any}
		accessibilityRole="heading"
	>
		{props.children}
	</label>
}

