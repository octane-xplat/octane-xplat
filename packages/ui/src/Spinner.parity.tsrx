// Measured parity fixtures — assertions live in Spinner.parity.check.ts.
import { Spinner } from './index.shared'
import type { ParityFixture } from './parity'

function ActivityIndicatorFixture() @{
	<Spinner
		className="parity-activity-indicator-root"
		busy={true}
		style={{ width: 24, height: 24 }}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'activity-indicator-busy', component: 'Spinner', renderer: ActivityIndicatorFixture, props: {} },
]
