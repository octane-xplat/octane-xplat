// Measured parity fixtures — assertions live in Breadcrumbs.parity.check.ts.
import { Breadcrumbs } from '../../index.shared'
import type { ParityFixture } from '../../parity'

function BreadcrumbFixture() @{
	<Breadcrumbs
		className="parity-breadcrumb-root"
		style={{ width: 220, height: 36, backgroundColor: '#f5f5f5' }}
		items={[{ label: 'Home', onSelect: () => {} }, { label: 'Settings' }, { label: 'Profile' }]}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'breadcrumb-trail', component: 'Breadcrumbs', renderer: BreadcrumbFixture, props: {} },
]
