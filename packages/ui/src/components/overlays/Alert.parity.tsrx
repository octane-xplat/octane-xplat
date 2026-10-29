// Measured parity fixtures — assertions live in Alert.parity.check.ts.
import { Alert } from './Alert'
import { Text } from '../content/Text'
import type { ParityFixture } from '../../parity'

function AlertFixture() @{
	<Alert
		className="parity-alert-root"
		style={{ width: 220, height: 64, backgroundColor: '#f5f5f5' }}
		tone="warning"
		icon="tab-home"
		title="Review needed"
	>
		<Text>Check the pending changes.</Text>
	</Alert>
}

export const PARITY: ParityFixture[] = [
	{ name: 'alert-warning', component: 'Alert', renderer: AlertFixture, props: {} },
]
