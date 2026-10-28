// Port of upstream Slider/SliderFormattedValue.tsx (Astryx 0.6.4, MIT).
import { Slider } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SliderFormattedValue() @{
	const [value, setValue] = useState(72)

	<Slider
		style={{ width: 300 }}
		label="Temperature"
		value={value}
		onValueChange={(v) => setValue(v as number)}
		valueDisplay="text"
		min={60}
		max={90}
		step={1}
		formatValue={(v) => `${v}°F`}
	/>
}
