// Port of upstream Toolbar/ToolbarThreeSlot.tsx (Astryx 0.6.4, MIT).
import { Button, Card, Heading, Icon, Toolbar } from '@octane-xplat/ui'

export function ToolbarThreeSlot() @{
	<Card padding={0} style={{ width: 500 }}>
		<Toolbar
			label="Three slot toolbar"
			size="md"
			dividers={['bottom']}
			startContent={<Heading level={4}>Reports</Heading>}
			centerContent={<Button label="Refresh" variant="ghost" icon={<Icon name="sandbox-arrow-right" />} isIconOnly />}
			endContent={<Button label="Export" variant="secondary" size="sm" />}
		/>
	</Card>
}
