// Measured parity fixtures — assertions live in HStack.parity.check.ts.
import { HStack } from './HStack'
import { View } from './View'
import type { ParityFixture } from './parity'

function RowLayoutFixture() @{
	<HStack className="parity-row-root" style={{ width: 96, height: 32 }} gap={2}>
		<View className="parity-row-first" style={{ width: 20, height: 10 }} />
		<View className="parity-row-second" style={{ width: 12, height: 10 }} />
	</HStack>
}

export const PARITY: ParityFixture[] = [
	{ name: 'row-layout', component: 'HStack', renderer: RowLayoutFixture, props: {} },
]
