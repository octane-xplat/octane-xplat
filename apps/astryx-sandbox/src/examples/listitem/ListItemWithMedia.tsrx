// Port of upstream ListItem/ListItemWithMedia.tsx (Astryx 0.6.4, MIT).
import { Avatar, List, ListItem } from '@octane-xplat/ui'

export function ListItemWithMedia() @{
	<List hasDividers>
		<ListItem
			label="Ada Lovelace"
			description="Design systems engineer"
			startContent={<Avatar name="Ada Lovelace" size={40} />}
		/>
		<ListItem
			label="Grace Hopper"
			description="Compiler platform"
			startContent={<Avatar name="Grace Hopper" size={40} />}
		/>
	</List>
}
