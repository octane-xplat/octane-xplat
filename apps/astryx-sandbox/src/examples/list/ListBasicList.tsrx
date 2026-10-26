// Port of upstream List/ListBasicList.tsx (Astryx 0.6.4, MIT).
import { List, ListItem } from '@octane-xplat/ui'

export function ListBasicList() @{
	<List>
		<ListItem label="Notifications" description="Manage your alerts" />
		<ListItem label="Privacy" description="Control your data" />
		<ListItem label="Security" description="Password and 2FA" />
	</List>
}
