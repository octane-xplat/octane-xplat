/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import { cx } from '@octane-xplat/lib'
import type { MeterProps } from './props'
import { meterRange } from './meter-math'

export function Meter(props: MeterProps) @{
	const min = props.minValue ?? 0
	const max = props.maxValue ?? props.max ?? 100
	const { max: rangeMax, value } = meterRange(props.value, min, max)

	<masonview id={props.id} className={cx('vx-meter', props.className)} accessibilityRole="meter" accessibilityLabel={props.accessibilityLabel} accessibilityValue={value} accessibilityMinValue={min} accessibilityMaxValue={rangeMax} accessibilityValueDescription={props.valueLabel ?? `${value} of ${rangeMax}`} style={mergeStyle({ display: 'grid', width: props.size ?? 24, height: props.size ?? 24 }, props.style)}>
		<label>
			{String(value) + ' / ' + String(rangeMax)}
		</label>
	</masonview>
}
