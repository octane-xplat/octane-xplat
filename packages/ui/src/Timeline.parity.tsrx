// Measured parity fixtures — assertions live in Timeline.parity.check.ts.
import { Timeline } from './Timeline'
import type { ParityFixture } from './parity'

function TimelineFixture() @{
	<Timeline
		className="parity-timeline-root"
		style={{ width: 200, height: 112, backgroundColor: '#f5f5f5' }}
		items={[
			{ key: 'created', title: 'Created', description: 'Project started' },
			{ key: 'reviewed', title: 'Reviewed', description: 'Changes approved' },
		]}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'timeline-two-events', component: 'Timeline', renderer: TimelineFixture, props: {}, height: 128 },
]
