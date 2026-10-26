// Port of upstream TabList/TabListTabsFillLayout.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Tab, TabList } from '@octane-xplat/ui'

export function TabListTabsFillLayout() @{
	const [value, setValue] = useState('home')
	<div style={{ width: 500 }}>
		<TabList value={value} onChange={setValue} layout="fill" hasDivider>
			<Tab value="home" label="Home" />
			<Tab value="projects" label="Projects" />
			<Tab value="settings" label="Settings" />
		</TabList>
	</div>
}
