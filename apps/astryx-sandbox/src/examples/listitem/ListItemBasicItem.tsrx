// Port of upstream ListItem/ListItemBasicItem.tsx (Astryx 0.6.4, MIT).
import { List, ListItem } from '@octane-xplat/ui'

export function ListItemBasicItem() @{
	<List header="Account settings" hasDividers>
		<ListItem label="Profile" description="Name, avatar, and bio" />
		<ListItem label="Notifications" description="Email and push alerts" />
		<ListItem label="Security" description="Password and two-factor auth" />
	</List>
}
