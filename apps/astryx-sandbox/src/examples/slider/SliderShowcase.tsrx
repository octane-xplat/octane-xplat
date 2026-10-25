// Port of upstream Slider/SliderShowcase.tsx (Astryx 0.6.4, MIT).
import { Slider } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SliderShowcase() @{
	const [value, setValue] = useState(50)
	<Slider label="Volume" value={value} onValueChange={(v) => setValue(v as number)} style={{width: 300}} />
}
