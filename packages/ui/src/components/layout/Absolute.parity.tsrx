// Measured parity fixtures — assertions live in Absolute.parity.check.ts.
import { Absolute } from './Absolute'
import { View } from './View'
import type { ParityFixture } from '../../parity'

function AbsoluteLayoutFixture() @{
	<Absolute
		className="parity-absolute-root"
		style={{ width: 96, height: 48, backgroundColor: '#f5f5f5' }}
	>
		<View className="parity-absolute-first" left={8} top={6} style={{ width: 20, height: 10 }} />
		<View className="parity-absolute-second" left={40} top={24} style={{ width: 12, height: 8 }} />
	</Absolute>
}

export const PARITY: ParityFixture[] = [
	{ name: 'absolute-layout', component: 'Absolute', renderer: AbsoluteLayoutFixture, props: {} },
]
