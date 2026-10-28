// Measured parity fixtures — assertions live in SegmentedControl.parity.check.ts.
import { SegmentedControl } from './SegmentedControl'
import type { ParityFixture } from './parity'

function SegmentedControlFixture() @{
	<SegmentedControl
		className="parity-segmented-root"
		options={[
			{ value: 'day', label: 'Day' },
			{ value: 'week', label: 'Week' },
		]}
		value="day"
		style={{ width: 180, height: 40, backgroundColor: '#f5f5f5' }}
	/>
}

export const PARITY: ParityFixture[] = [
	{
		name: 'segmented-control-selected',
		component: 'SegmentedControl',
		renderer: SegmentedControlFixture,
		props: {},
	},
]
