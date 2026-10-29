// Measured parity fixtures — assertions live in Selector.parity.check.ts.
import { Selector } from '../../index.shared'
import type { ParityFixture } from '../../parity'

function SelectFixture() @{
	<Selector
		className="parity-select-root"
		selectionMode="single"
		options={[
			{ value: 'small', label: 'Small' },
			{ value: 'large', label: 'Large' },
		]}
		value="small"
		style={{ width: 160, height: 40, backgroundColor: '#f5f5f5' }}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'select-value', component: 'Selector', renderer: SelectFixture, props: {} },
]
