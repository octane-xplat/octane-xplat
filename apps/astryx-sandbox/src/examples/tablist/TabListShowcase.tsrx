// Port of upstream TabList/TabListShowcase.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Tab, TabList } from '@octane-xplat/ui'

export function TabListShowcase() @{
	const [value, setValue] = useState('home')

	<TabList value={value} onChange={setValue}>
		<Tab value="home" label="Home" />
		<Tab value="projects" label="Projects" />
		<Tab value="settings" label="Settings" />
	</TabList>
}
