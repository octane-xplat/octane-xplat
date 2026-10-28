// Port of upstream Tab/TabShowcase.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Badge, Tab, TabList } from '@octane-xplat/ui'

export function TabShowcase() @{
	const [value, setValue] = useState('inbox')

	<TabList value={value} onChange={setValue}>
		<Tab value="inbox" label="Inbox" endContent={<Badge label="3" variant="info" />} />
	</TabList>
}
