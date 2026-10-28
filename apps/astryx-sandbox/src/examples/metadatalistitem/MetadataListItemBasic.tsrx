// Port of upstream MetadataListItem/MetadataListItemBasic.tsx (Astryx 0.6.4, MIT).
import { Badge, MetadataList, MetadataListItem } from '@octane-xplat/ui'

export function MetadataListItemBasic() @{
	<MetadataList title="Deployment">
		<MetadataListItem label="Environment">Production</MetadataListItem>
		<MetadataListItem label="Status">
			<Badge label="Healthy" variant="green" />
		</MetadataListItem>
		<MetadataListItem label="Version">v2.14.0</MetadataListItem>
		<MetadataListItem label="Last deployed">June 12, 2026</MetadataListItem>
	</MetadataList>
}
