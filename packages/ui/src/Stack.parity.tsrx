// Measured parity fixtures — assertions live in Stack.parity.check.ts.
import { Absolute } from './Absolute'
import { View } from './View'
import type { ParityFixture } from './parity'

// Overlap migrated to Absolute: the public Stack is now the Astryx flow
// container (same-cell layering belongs to Absolute). Element ids stay so
// the stack-overlay-layout parity assertions still ref.
function StackLayoutFixture() @{
	<Absolute className="parity-stack-root" style={{ width: 96, height: 48 }}>
		<View className="parity-stack-base" style={{ width: 48, height: 32 }} />
		<View className="parity-stack-overlay" style={{ width: 20, height: 10 }} />
	</Absolute>
}

export const PARITY: ParityFixture[] = [
	{ name: 'stack-overlay-layout', component: 'Stack', renderer: StackLayoutFixture, props: {} },
]
