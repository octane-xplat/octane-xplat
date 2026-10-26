// Port of upstream TabMenu/TabMenuShowcase.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Tab, TabList, TabMenu } from '@octane-xplat/ui'

export function TabMenuShowcase() @{
	const [value, setValue] = useState('settings')
	<TabList value={value} onChange={setValue}>
		<Tab value="overview" label="Overview" />
		<Tab value="activity" label="Activity" />
		<TabMenu label="More" options={[{ value: 'settings', label: 'Settings' }, { value: 'integrations', label: 'Integrations' }, { value: 'billing', label: 'Billing' }]} />
	</TabList>
}
