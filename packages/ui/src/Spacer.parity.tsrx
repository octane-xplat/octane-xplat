// Measured parity fixtures — assertions live in Spacer.parity.check.ts.
import { HStack } from './HStack'
import { Spacer } from './Spacer'
import { View } from './View'
import type { ParityFixture } from './parity'

function SpacerLayoutFixture() @{
	<HStack className="parity-spacer-root" style={{ width: 96, height: 24 }} gap={2}>
		<View className="parity-spacer-leading" style={{ width: 16, height: 10 }} />
		<Spacer className="parity-spacer" />
		<View className="parity-spacer-trailing" style={{ width: 16, height: 10 }} />
	</HStack>
}

export const PARITY: ParityFixture[] = [
	{ name: 'spacer-layout', component: 'Spacer', renderer: SpacerLayoutFixture, props: {} },
]
