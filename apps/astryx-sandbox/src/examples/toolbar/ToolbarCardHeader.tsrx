// Port of upstream Toolbar/ToolbarCardHeader.tsx (Astryx 0.6.4, MIT).
import { Button, Card, Heading, Icon, Section, Toolbar } from '@octane-xplat/ui'

export function ToolbarCardHeader() @{
	<Card style={{ width: 500, height: '100%', marginTop: 260 }}>
		<Toolbar
			label="User list actions"
			size="sm"
			dividers={['bottom']}
			startContent={<Heading level={4}>Card title</Heading>}
			endContent={
				<>
					<Button label="Filter" variant="ghost" icon={<Icon name="sandbox-funnel" />} isIconOnly />
					<Button label="Add user" icon={<Icon name="sandbox-plus" />} isIconOnly />
				</>
			}
		/>
		<Section />
	</Card>
}
