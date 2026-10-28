// Measured parity fixtures — assertions live in CheckboxList.parity.check.ts.
import { CheckboxList } from './index.shared'
import type { ParityFixture } from './parity'

function CheckboxGroupFixture() @{
	<CheckboxList
		className="parity-checkboxgroup-root"
		options={[
			{ value: 'email', label: 'Email' },
			{ value: 'sms', label: 'SMS' },
		]}
		value={['email']}
		style={{ width: 180, height: 56, backgroundColor: '#f5f5f5' }}
	/>
}

export const PARITY: ParityFixture[] = [
	{
		name: 'checkbox-group-selected',
		component: 'CheckboxList',
		renderer: CheckboxGroupFixture,
		props: {},
	},
]
