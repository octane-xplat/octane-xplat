// Port of upstream TabList/TabListTabsWithActions.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Button, Icon, Tab, TabList } from '@octane-xplat/ui'

export function TabListTabsWithActions() @{
	const [value, setValue] = useState('all')

	<TabList value={value} onChange={setValue} size="lg" hasDivider>
		<Tab value="all" label="All items" />
		<Tab value="active" label="Active" />
		<Tab value="archived" label="Archived" />
		<div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
			<Button
				label="Filter"
				variant="ghost"
				size="lg"
				icon={<Icon name="sandbox-funnel" />}
				isIconOnly
			/>
			<Button label="New item" variant="primary" size="lg" icon={<Icon name="sandbox-plus" />} />
		</div>
	</TabList>
}
