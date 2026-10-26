// Port of upstream Toolbar/ToolbarTableFilter.tsx (Astryx 0.6.4, MIT).
import { Button, Card, Icon, TextInput, Toolbar } from '@octane-xplat/ui'

export function ToolbarTableFilter() @{
	<Card padding={0} style={{ width: 500 }}>
		<Toolbar
			label="Filter users"
			size="sm"
			dividers={['bottom']}
			startContent={<TextInput placeholder="Search users" label="Search users" isLabelHidden style={{ width: 220 }} />}
			endContent={
				<>
					<Button label="Filter" variant="ghost" icon={<Icon name="sandbox-funnel" />} isIconOnly />
					<Button label="Export" variant="secondary" size="sm" />
				</>
			}
		/>
	</Card>
}
