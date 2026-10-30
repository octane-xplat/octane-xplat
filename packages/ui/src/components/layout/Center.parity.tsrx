// Measured parity fixtures — assertions live in Center.parity.check.ts.
import { Center } from './Center'
import { View } from './View'
import type { ParityFixture } from '../../parity'

function CenterFixedChildFixture() @{
	<Center className="parity-center-root" style={{ width: 96, height: 48 }}>
		<View className="parity-center-child" style={{ width: 20, height: 10 }} />
	</Center>
}

export const PARITY: ParityFixture[] = [
	{ name: 'center-fixed-child', component: 'Center', renderer: CenterFixedChildFixture, props: {} },
]
