// Measured parity fixtures — assertions live in View.parity.check.ts.
import { View } from './View'
import type { ParityFixture } from '../../parity'

function ViewLayoutFixture() @{
	<View className="parity-view-root" style={{ width: 96, height: 48 }} gap={6}>
		<View className="parity-view-first" style={{ width: 20, height: 10 }} />
		<View className="parity-view-second" style={{ width: 20, height: 10 }} />
	</View>
}

function ViewPaddingLayoutFixture() @{
	<View className="parity-padded-view-root" style={{ width: 96, height: 48, padding: 8 }} gap={6}>
		<View className="parity-padded-view-first" style={{ width: 20, height: 10 }} />
		<View className="parity-padded-view-second" style={{ width: 20, height: 10 }} />
	</View>
}

function PercentSizeLayoutFixture() @{
	<View className="parity-percent-root" style={{ width: '50%', height: '50%' }} />
}

export const PARITY: ParityFixture[] = [
	{ name: 'view-layout', component: 'View', renderer: ViewLayoutFixture, props: {} },
	{ name: 'view-padding-layout', component: 'View', renderer: ViewPaddingLayoutFixture, props: {} },
	{ name: 'percent-size-layout', component: 'View', renderer: PercentSizeLayoutFixture, props: {} },
]
