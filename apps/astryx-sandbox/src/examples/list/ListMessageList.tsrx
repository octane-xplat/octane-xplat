// Port of upstream List/ListMessageList.tsx (Astryx 0.6.4, MIT).
import { Avatar, Badge, List, ListItem } from '@octane-xplat/ui'

export function ListMessageList() @{
	<List hasDividers>
		<ListItem
			label="Alex Johnson"
			description="Hey, are we still on for lunch tomorrow?"
			startContent={<Avatar name="Alex Johnson" size={40} />}
			onPress={() => {}}
			endContent={<Badge label="2" />}
		/>
		<ListItem
			label="Sam Rivera"
			description="I pushed the latest changes to the repo"
			startContent={<Avatar name="Sam Rivera" size={40} />}
			onPress={() => {}}
		/>
		<ListItem
			label="Jordan Lee"
			description="Can you review the design spec when you get a chance?"
			startContent={<Avatar name="Jordan Lee" size={40} />}
			onPress={() => {}}
			endContent={<Badge label="5" />}
		/>
	</List>
}
