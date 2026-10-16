// Measured parity fixtures — assertions live in EmptyState.parity.check.ts.
import { EmptyState } from './index.shared'
import type { ParityFixture } from './parity'

function EmptyFixture() @{
	<EmptyState
		className="parity-empty-root"
		icon="tab-home"
		title="No results"
		description="Try another search."
		style={{ width: 220, height: 120, backgroundColor: '#f5f5f5' }}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'empty-state', component: 'EmptyState', renderer: EmptyFixture, props: {}, height: 136 },
]
