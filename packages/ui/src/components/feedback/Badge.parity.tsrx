// Measured parity fixtures — assertions live in Badge.parity.check.ts.
import { Badge } from './Badge'
import { Text } from '../content/Text'
import type { ParityFixture } from '../../parity'

function BadgeFixture() @{
	<Badge
		className="parity-badge-root"
		style={{ width: 120, height: 32, backgroundColor: '#dbeafe' }}
	>
		<Text>Preview</Text>
	</Badge>
}

function BadgeTextFixture() @{
	<Badge className="parity-badge-text" style={{ backgroundColor: '#dbeafe' }}>
		{'42'}
	</Badge>
}

export const PARITY: ParityFixture[] = [
	{ name: 'badge-basic', component: 'Badge', renderer: BadgeFixture, props: {} },
	{ name: 'badge-text', component: 'Badge', renderer: BadgeTextFixture, props: {} },
]
