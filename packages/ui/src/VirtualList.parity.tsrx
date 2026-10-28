// Measured parity fixtures — assertions live in VirtualList.parity.check.ts.
import { View } from './View'
import { VirtualList } from './VirtualList'
import type { ParityFixture } from './parity'

function VirtualListFixture() @{
	<VirtualList
		className="parity-virtual-list-root"
		style={{ width: 220, height: 64 }}
		items={[
			{ key: 'alpha' },
			{ key: 'beta' },
			{ key: 'gamma' },
			{ key: 'delta' },
			{ key: 'epsilon' },
			{ key: 'zeta' },
		]}
		keyExtractor={(item: any) => item.key}
		renderItem={() => (
			<View className="parity-virtual-list-item-content" style={{ width: 200, height: 24 }} />
		)}
	/>
}

export const PARITY: ParityFixture[] = [
	{
		name: 'virtual-list-viewport',
		component: 'VirtualList',
		renderer: VirtualListFixture,
		props: {},
	},
]
