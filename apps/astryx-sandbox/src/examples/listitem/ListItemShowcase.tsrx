// Port of upstream ListItem/ListItemShowcase.tsx (Astryx 0.6.4, MIT).
import { Badge, Icon, List, ListItem } from '@octane-xplat/ui'

export function ListItemShowcase() @{
	<List header="Settings" hasDividers>
		<ListItem
			label="Notifications"
			description="Push, email, and SMS alerts"
			startContent={<Icon name="xplat-info" />}
			endContent={<Badge label="3 new" variant="blue" />}
			onPress={() => {}}
		/>
		<ListItem
			label="Privacy"
			description="Manage data sharing preferences"
			startContent={<Icon name="xplat-search" />}
			onPress={() => {}}
		/>
		<ListItem
			label="Security"
			description="Password and two-factor auth"
			startContent={<Icon name="sandbox-lock" />}
			onPress={() => {}}
		/>
	</List>
}
