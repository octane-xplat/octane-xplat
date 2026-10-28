// Port of upstream Toolbar/ToolbarWithTabs.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Button, Card, Icon, Tab, TabList, Toolbar } from '@octane-xplat/ui'

export function ToolbarWithTabs() @{
	const [value, setValue] = useState('all')

	<Card padding={0} style={{ width: 500 }}>
		<Toolbar
			label="Project actions"
			size="sm"
			dividers={['bottom']}
			startContent={
				<TabList value={value} onChange={setValue} size="sm">
					<Tab value="all" label="All" />
					<Tab value="active" label="Active" />
					<Tab value="archived" label="Archived" />
				</TabList>
			}
			endContent={
				<>
					<Button label="Filter" variant="ghost" icon={<Icon name="sandbox-funnel" />} isIconOnly />
					<Button label="New" variant="primary" size="sm" icon={<Icon name="sandbox-plus" />} />
				</>
			}
		/>
	</Card>
}
