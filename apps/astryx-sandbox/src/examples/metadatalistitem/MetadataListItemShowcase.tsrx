// Port of upstream MetadataListItem/MetadataListItemShowcase.tsx (Astryx 0.6.4, MIT).
import { Badge, Link, MetadataList, MetadataListItem } from '@octane-xplat/ui'

export function MetadataListItemShowcase() @{
	<MetadataList title="Project Details">
		<MetadataListItem label="Name">Design System v2</MetadataListItem>
		<MetadataListItem label="Status"><Badge label="Active" variant="green" /></MetadataListItem>
		<MetadataListItem label="Owner"><Link href="#">Alice Johnson</Link></MetadataListItem>
		<MetadataListItem label="Created">January 15, 2025</MetadataListItem>
		<MetadataListItem label="Priority"><Badge label="High" variant="red" /></MetadataListItem>
		<MetadataListItem label="Repository"><Link href="#">github.com/org/design-system</Link></MetadataListItem>
	</MetadataList>
}
