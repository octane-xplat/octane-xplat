// Port of upstream MetadataList/MetadataListHorizontalMetadata.tsx (Astryx 0.6.4, MIT).
import { MetadataList, MetadataListItem } from '@octane-xplat/ui'

export function MetadataListHorizontalMetadata() @{
	<MetadataList orientation="horizontal">
		<MetadataListItem label="Status">Active</MetadataListItem>
		<MetadataListItem label="Type">Premium</MetadataListItem>
		<MetadataListItem label="Owner">Joey</MetadataListItem>
		<MetadataListItem label="Created">Jan 15, 2026</MetadataListItem>
	</MetadataList>
}
