// Measured parity fixtures — assertions live in Overlay.parity.check.ts.
import { Overlay } from './Overlay'
import { View } from './View'
import type { ParityFixture } from './parity'

function OverlayLayoutFixture(props: { marker: string }) @{
	<Overlay
		open
		shadeCover={false}
		className={props.marker}
		style={{ width: 96, height: 48, backgroundColor: '#f5f5f5' }}
	>
		<View style={{ width: 96, height: 48 }} />
	</Overlay>
}

export const PARITY: ParityFixture[] = [
	{
		name: 'overlay-fixed-frame',
		component: 'Overlay',
		renderer: OverlayLayoutFixture,
		props: { marker: 'parity-portal--overlay-fixed-frame' },
	},
]
