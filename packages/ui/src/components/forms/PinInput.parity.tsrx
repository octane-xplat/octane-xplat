// Measured parity fixtures — assertions live in PinInput.parity.check.ts.
import { PinInput } from './PinInput'
import type { ParityFixture } from '../../parity'

function PinInputFixture() @{
	<PinInput
		className="parity-pininput-root"
		length={4}
		value="2648"
		style={{ width: 200, height: 44, backgroundColor: '#f5f5f5' }}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'pin-input-filled', component: 'PinInput', renderer: PinInputFixture, props: {} },
]
