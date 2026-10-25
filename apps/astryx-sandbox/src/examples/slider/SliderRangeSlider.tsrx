// Port of upstream Slider/SliderRangeSlider.tsx (Astryx 0.6.4, MIT).
import { Slider } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SliderRangeSlider() @{
	const [value, setValue] = useState<[number, number]>([20, 80])
	<Slider label="Price range" value={value} onValueChange={(v) => setValue(v as [number, number])} style={{width: 300}} />
}
