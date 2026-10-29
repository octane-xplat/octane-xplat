// Measured parity fixtures — assertions live in Tabs.parity.check.ts.
import { Tabs } from './Tabs'
import { View } from '../layout/View'
import type { ParityFixture } from '../../parity'

function TabsFixture() @{
	<Tabs
		className="parity-tabs-root"
		style={{ width: 200, height: 104, backgroundColor: '#f5f5f5' }}
		selectedKey="1"
		tabs={[
			{ title: 'Overview', render: () => <View style={{ width: 200, height: 48 }} /> },
			{
				title: 'Activity',
				render: () => (
					<View className="parity-tabs-pane-child" style={{ width: 200, height: 48 }} />
				),
			},
		]}
	/>
}

export const PARITY: ParityFixture[] = [
	{
		name: 'tabs-second-selected',
		component: 'Tabs',
		renderer: TabsFixture,
		props: {},
		height: 120,
	},
]
