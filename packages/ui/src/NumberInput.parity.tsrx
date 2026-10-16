// Measured parity fixtures — assertions live in NumberInput.parity.check.ts.
import { NumberInput } from './index.shared'
import type { ParityFixture } from './parity'

function InputNumberFixture() @{
	<NumberInput
		className="parity-inputnumber-root"
		value={2}
		min={0}
		max={5}
		step={1}
		style={{ width: 160, height: 40, backgroundColor: '#f5f5f5' }}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'input-number-value', component: 'NumberInput', renderer: InputNumberFixture, props: {} },
]
