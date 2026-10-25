// Port of upstream Slider/SliderWithMarks.tsx (Astryx 0.6.4, MIT).
import { Slider } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SliderWithMarks() @{
	const [value, setValue] = useState(50)
	<Slider style={{width: 300}} label="Volume" value={value} onValueChange={(v) => setValue(v as number)} marks={[{ value: 0, label: '0' }, { value: 25, label: '25' }, { value: 50, label: '50' }, { value: 75, label: '75' }, { value: 100, label: '100' }]} />
}
