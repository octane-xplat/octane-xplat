// Measured parity fixtures — assertions live in Stepper.parity.check.ts.
import { Stepper } from './Stepper'
import type { ParityFixture } from '../../parity'

function StepperFixture() @{
	<Stepper
		className="parity-stepper-root"
		style={{ width: 220, height: 40, backgroundColor: '#f5f5f5' }}
		steps={[
			{ key: 'account', label: 'Account' },
			{ key: 'profile', label: 'Profile' },
			{ key: 'review', label: 'Review' },
		]}
		current={1}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'stepper-middle-active', component: 'Stepper', renderer: StepperFixture, props: {} },
]
