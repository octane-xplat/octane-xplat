// Measured parity fixtures — assertions live in VStack.parity.check.ts.
import { VStack } from './VStack'
import { View } from './View'
import type { ParityFixture } from '../../parity'

function ColumnLayoutFixture() @{
	<VStack className="parity-column-root" style={{ width: 96, height: 48 }} gap={1} align="center">
		<View className="parity-column-first" style={{ width: 16, height: 8 }} />
		<View className="parity-column-second" style={{ width: 20, height: 12 }} />
	</VStack>
}

export const PARITY: ParityFixture[] = [
	{ name: 'column-layout', component: 'VStack', renderer: ColumnLayoutFixture, props: {} },
]
