// Measured parity fixtures — assertions live in Screen.parity.check.ts.
import { Screen } from './Screen'
import { View } from './View'
import type { ParityFixture } from './parity'

function ScreenLayoutFixture() @{
	<Screen className="parity-screen-root" style={{ width: '100%', height: '100%' }}>
		<View className="parity-screen-child" style={{ width: 20, height: 10 }} />
	</Screen>
}

export const PARITY: ParityFixture[] = [
	{ name: 'screen-layout', component: 'Screen', renderer: ScreenLayoutFixture, props: {} },
]
