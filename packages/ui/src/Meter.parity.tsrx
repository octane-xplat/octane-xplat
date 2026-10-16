// Measured parity fixtures — assertions live in Meter.parity.check.ts.
import { Meter } from './Meter'
import type { ParityFixture } from './parity'

function MeterFixture() @{
	<Meter
		className="parity-meter-root"
		value={65}
		max={100}
		size={48}
		strokeWidth={6}
		color="#1f6feb"
		trackColor="#dbeafe"
		style={{ width: 48, height: 48, backgroundColor: '#f5f5f5' }}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'meter-progress', component: 'Meter', renderer: MeterFixture, props: {} },
]
