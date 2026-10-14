/** @jsxImportSource @octane-xplat/macos-renderer */
import type { MeterProps } from './props'
import { meterRange } from './meter-math'

export function Meter(props: MeterProps) @{
	const min = props.minValue ?? 0
	const max = props.maxValue ?? props.max ?? 100
	const { max: rangeMax, value } = meterRange(props.value, min, max)

	<gridlayout
		id={props.id}
		className={props.className}
		accessibilityRole="meter"
		accessibilityLabel={props.accessibilityLabel}
		accessibilityValue={value}
		accessibilityMinValue={min}
		accessibilityMaxValue={rangeMax}
		accessibilityValueDescription={props.valueLabel ?? `${value} of ${rangeMax}`}
	>
		<label>
			{String(value) + ' / ' + String(rangeMax)}
		</label>
	</gridlayout>
}
