// Measured parity fixtures — assertions live in Divider.parity.check.ts.
import { Divider } from './index.shared'
import type { ParityFixture } from './parity'

function SeparatorFixture() @{
	<Divider
		className="parity-separator-root"
		orientation="horizontal"
		style={{ width: 160, height: 2, backgroundColor: '#737373' }}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'separator-horizontal', component: 'Divider', renderer: SeparatorFixture, props: {} },
]
