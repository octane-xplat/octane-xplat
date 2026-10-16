// Measured parity fixtures — assertions live in ProgressGroup.parity.check.ts.
import { ProgressGroup } from './ProgressGroup'
import type { ParityFixture } from './parity'

function ProgressGroupFixture() @{
	<ProgressGroup
		className="parity-progress-group-root"
		style={{ width: 220, height: 88, backgroundColor: '#f5f5f5' }}
		items={[
			{ key: 'complete', label: 'Completed', value: 65, max: 100 },
			{ key: 'pending', label: 'Pending', value: 25, max: 100 },
		]}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'progress-group-two-items', component: 'ProgressGroup', renderer: ProgressGroupFixture, props: {}, height: 104 },
]
