// Port of upstream TabList/TabListTabsWithBadge.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Badge, Tab, TabList } from '@octane-xplat/ui'

export function TabListTabsWithBadge() @{
	const [value, setValue] = useState('inbox')

	<TabList value={value} onChange={setValue}>
		<Tab value="inbox" label="Inbox" endContent={<Badge variant="error" label="5" />} />
		<Tab value="sent" label="Sent" />
		<Tab value="drafts" label="Drafts" endContent={<Badge variant="neutral" label="2" />} />
	</TabList>
}
