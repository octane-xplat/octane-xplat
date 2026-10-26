// Port of upstream TabList/TabListTabsWithIcons.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Icon, Tab, TabList } from '@octane-xplat/ui'

export function TabListTabsWithIcons() @{
	const [value, setValue] = useState('home')
	<TabList value={value} onChange={setValue}>
		<Tab value="home" label="Home" icon={<Icon name="sandbox-home" />} />
		<Tab value="settings" label="Settings" icon={<Icon name="sandbox-cog" />} />
	</TabList>
}
