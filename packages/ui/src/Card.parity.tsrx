// Measured parity fixtures — assertions live in Card.parity.check.ts.
import { Card } from './Card'
import { Text } from './Text'
import { View } from './View'
import type { ParityFixture } from './parity'

function CardFixture() @{
	<Card
		className="parity-card-root"
		width={220}
		height={104}
		style={{ backgroundColor: '#f5f5f5' }}
		header={<Text>Workspace</Text>}
		footer={<Text>View details</Text>}
	>
		<View className="parity-card-body" style={{ width: 180, height: 32 }} />
	</Card>
}

export const PARITY: ParityFixture[] = [
	{ name: 'card-with-slots', component: 'Card', renderer: CardFixture, props: {}, height: 120 },
]
