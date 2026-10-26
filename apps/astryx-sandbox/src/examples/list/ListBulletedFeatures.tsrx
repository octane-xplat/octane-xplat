// Port of upstream List/ListBulletedFeatures.tsx (Astryx 0.6.4, MIT).
import { List, ListItem } from '@octane-xplat/ui'

export function ListBulletedFeatures() @{
	<List listStyle="disc">
		<ListItem label="Accessible by default" />
		<ListItem label="Themeable with StyleX" />
		<ListItem label="Composable and extensible" />
	</List>
}
