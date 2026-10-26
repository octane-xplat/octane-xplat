// Port of upstream MetadataList/MetadataListBasicMetadata.tsx (Astryx 0.6.4, MIT).
import { MetadataList, MetadataListItem } from '@octane-xplat/ui'

export function MetadataListBasicMetadata() @{
	<MetadataList>
		<MetadataListItem label="Name">MetadataList</MetadataListItem>
		<MetadataListItem label="Status">Active</MetadataListItem>
		<MetadataListItem label="Owner">Joey</MetadataListItem>
	</MetadataList>
}
