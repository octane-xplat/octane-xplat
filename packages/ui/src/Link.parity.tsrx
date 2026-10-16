// Measured parity fixtures — assertions live in Link.parity.check.ts.
import { Link } from './Link'
import { Text } from './Text'
import type { ParityFixture } from './parity'

function LinkFixture() @{
	<Link className="parity-link-root" href="/parity">
		<Text>Open parity</Text>
	</Link>
}

export const PARITY: ParityFixture[] = [
	{ name: 'link-fixed-target', component: 'Link', renderer: LinkFixture, props: {} },
]
