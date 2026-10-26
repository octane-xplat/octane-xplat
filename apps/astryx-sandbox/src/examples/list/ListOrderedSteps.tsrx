// Port of upstream List/ListOrderedSteps.tsx (Astryx 0.6.4, MIT).
import { List, ListItem } from '@octane-xplat/ui'

export function ListOrderedSteps() @{
	<List listStyle="decimal">
		<ListItem label="Install the package" description="npm install @astryxdesign/core" />
		<ListItem label="Import components" description="import { List } from '@astryxdesign/core'" />
		<ListItem label="Start building" description="Use components in your app" />
	</List>
}
