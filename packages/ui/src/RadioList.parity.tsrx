// Measured parity fixtures — assertions live in RadioList.parity.check.ts.
import { RadioList } from './index.shared'
import type { ParityFixture } from './parity'

function RadioGroupFixture() @{
	<RadioList
		className="parity-radiogroup-root"
		options={[{ value: 'low', label: 'Low' }, { value: 'high', label: 'High' }]}
		value="low"
		style={{ width: 180, height: 56, backgroundColor: '#f5f5f5' }}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'radio-group-selected', component: 'RadioList', renderer: RadioGroupFixture, props: {} },
]
