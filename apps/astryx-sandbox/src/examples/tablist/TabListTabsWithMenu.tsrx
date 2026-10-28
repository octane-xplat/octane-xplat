// Port of upstream TabList/TabListTabsWithMenu.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Tab, TabList, TabMenu } from '@octane-xplat/ui'

export function TabListTabsWithMenu() @{
	const [value, setValue] = useState('home')

	<TabList value={value} onChange={setValue}>
		<Tab value="home" label="Home" />
		<Tab value="projects" label="Projects" />
		<TabMenu
			label="More"
			options={[
				{ value: 'analytics', label: 'Analytics' },
				{ value: 'reports', label: 'Reports' },
				{ value: 'billing', label: 'Billing' },
			]}
		/>
	</TabList>
}
