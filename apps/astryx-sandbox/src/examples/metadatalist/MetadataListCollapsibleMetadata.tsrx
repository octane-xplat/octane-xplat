// Port of upstream MetadataList/MetadataListCollapsibleMetadata.tsx (Astryx 0.6.4, MIT).
import { MetadataList, MetadataListItem } from '@octane-xplat/ui'

export function MetadataListCollapsibleMetadata() @{
	<MetadataList maxNumOfItems={3}>
		<MetadataListItem label="Name">MetadataList</MetadataListItem>
		<MetadataListItem label="Status">Active</MetadataListItem>
		<MetadataListItem label="Owner">Joey</MetadataListItem>
		<MetadataListItem label="Created">Jan 15, 2026</MetadataListItem>
		<MetadataListItem label="Updated">Mar 26, 2026</MetadataListItem>
		<MetadataListItem label="Priority">Tier 1</MetadataListItem>
	</MetadataList>
}
