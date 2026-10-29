// Measured parity fixtures — assertions live in Collapsible.parity.check.ts.
import { Collapsible } from './Collapsible'
import { Text } from '../content/Text'
import { View } from '../layout/View'
import type { ParityFixture } from '../../parity'

function CollapsibleFixture() @{
	<Collapsible
		className="parity-collapsible-root"
		style={{ width: 180, height: 72, backgroundColor: '#f5f5f5' }}
		trigger={<Text>Details</Text>}
		open={true}
	>
		<View className="parity-collapsible-content" style={{ width: 160, height: 24 }} />
	</Collapsible>
}

export const PARITY: ParityFixture[] = [
	{
		name: 'collapsible-open',
		component: 'Collapsible',
		renderer: CollapsibleFixture,
		props: {},
		height: 88,
	},
]
