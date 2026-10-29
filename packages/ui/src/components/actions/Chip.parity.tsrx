// Measured parity fixtures — assertions live in Chip.parity.check.ts.
import { Chip } from './Chip'
import { Text } from '../content/Text'
import type { ParityFixture } from '../../parity'

function ChipFixture() @{
	<Chip
		className="parity-chip-root"
		style={{ width: 96, height: 32 }}
		selected={true}
		accessibilityLabel="Active filter"
	>
		<Text>Active</Text>
	</Chip>
}

export const PARITY: ParityFixture[] = [
	{ name: 'chip-selected', component: 'Chip', renderer: ChipFixture, props: {} },
]
