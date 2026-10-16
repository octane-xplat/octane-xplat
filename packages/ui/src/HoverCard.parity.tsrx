// Measured parity fixtures — assertions live in HoverCard.parity.check.ts.
import { HoverCard } from './HoverCard'
import { Text } from './Text'
import { View } from './View'
import type { ParityFixture } from './parity'

// Popup contents only mount after pointer/focus intent; compare each default anchor state here.
function HoverableFixture() @{
	<HoverCard
		className="parity-hoverable-anchor"
		style={{ width: 180, height: 48, backgroundColor: '#f5f5f5' }}
		content={<Text>Delayed hover card</Text>}
	>
		<View className="parity-hoverable-child" style={{ width: 72, height: 24, backgroundColor: '#0a0a0a' }} />
	</HoverCard>
}

export const PARITY: ParityFixture[] = [
	{ name: 'hoverable-anchor', component: 'HoverCard', renderer: HoverableFixture, props: {} },
]
