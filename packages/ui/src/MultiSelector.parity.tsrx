// Measured parity fixtures — assertions live in MultiSelector.parity.check.ts.
import { MultiSelector } from './index.shared'
import type { ParityFixture } from './parity'

function SelectMenuFixture() @{
	<MultiSelector
		className="parity-selectmenu-root"
		selectionMode="multiple"
		options={[{ value: 'small', label: 'Small' }, { value: 'large', label: 'Large' }]}
		value={['small']}
		style={{ width: 160, height: 40, backgroundColor: '#f5f5f5' }}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'select-menu-value', component: 'MultiSelector', renderer: SelectMenuFixture, props: {} },
]
