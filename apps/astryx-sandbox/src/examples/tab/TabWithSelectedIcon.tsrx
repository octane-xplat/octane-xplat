// Port of upstream Tab/TabWithSelectedIcon.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Icon, Tab, TabList } from '@octane-xplat/ui'

export function TabWithSelectedIcon() @{
	const [value, setValue] = useState('favorites')
	<TabList value={value} onChange={setValue}>
		<Tab value="favorites" label="Favorites" icon={<Icon name="sandbox-bookmark" />} selectedIcon={<Icon name="sandbox-bookmark-solid" />} />
		<Tab value="recent" label="Recent" />
	</TabList>
}
