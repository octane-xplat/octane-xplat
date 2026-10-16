// Measured parity fixtures — assertions live in Pager.parity.check.ts.
import { Pager } from './Pager'
import { View } from '@octane-xplat/ui'
import type { ParityFixture } from '@octane-xplat/ui/parity'

function PagerFixture() @{
	<Pager
		className="parity-pager-root"
		style={{ width: 220, height: 96, backgroundColor: '#f5f5f5' }}
		items={[{ key: 'first' }, { key: 'second' }]}
		renderItem={() => (
			<View className="parity-pager-page" style={{ width: 220, height: 96 }} />
		)}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'pager-two-pages', component: 'Pager', renderer: PagerFixture, props: {} },
]
