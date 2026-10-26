// Port of upstream ListItem/ListItemWithMetadata.tsx (Astryx 0.6.4, MIT).
import { Badge, List, ListItem, Text } from '@octane-xplat/ui'

export function ListItemWithMetadata() @{
	<List hasDividers>
		<ListItem label="Q3 report.pdf" description="Modified today" endContent={<Text color="secondary">2.1 MB</Text>} />
		<ListItem label="Design spec" description="Modified yesterday" endContent={<Badge label="Draft" variant="neutral" />} />
	</List>
}
