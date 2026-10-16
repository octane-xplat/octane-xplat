// Measured parity fixtures — assertions live in Slider.parity.check.ts.
import { Slider } from './Slider'
import type { ParityFixture } from './parity'

function SliderFixture(props: { id?: string; value: number }) @{
	<Slider id={props.id} value={props.value} minValue={0} maxValue={100} />
}

export const PARITY: ParityFixture[] = [
	{ name: 'slider-0', component: 'Slider', renderer: SliderFixture, props: { value: 0 }, wide: true },
	{ name: 'slider-50', component: 'Slider', renderer: SliderFixture, props: { id: 'probe-slider-50', value: 50 }, wide: true },
]
