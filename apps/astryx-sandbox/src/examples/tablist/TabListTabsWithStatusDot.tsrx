// Port of upstream TabList/TabListTabsWithStatusDot.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { StatusDot, Tab, TabList } from '@octane-xplat/ui'

export function TabListTabsWithStatusDot() @{
	const [value, setValue] = useState('production')

	<TabList value={value} onChange={setValue}>
		<Tab
			value="production"
			label="Production"
			endContent={<StatusDot variant="success" label="Healthy" />}
		/>
		<Tab
			value="staging"
			label="Staging"
			endContent={<StatusDot variant="warning" label="Degraded" />}
		/>
		<Tab value="development" label="Development" />
	</TabList>
}
