// Port of upstream MetadataList/MetadataListMultiColumnMetadata.tsx (Astryx 0.6.4, MIT).
import { HStack, MetadataList, MetadataListItem, Token } from '@octane-xplat/ui'

export function MetadataListMultiColumnMetadata() @{
	<MetadataList columns="multi">
		<MetadataListItem label="Name">MetadataList</MetadataListItem>
		<MetadataListItem label="Status">Active</MetadataListItem>
		<MetadataListItem label="Owner">Joey</MetadataListItem>
		<MetadataListItem label="Created">Jan 15, 2026</MetadataListItem>
		<MetadataListItem label="Tags">
			<HStack gap={1}>
				<Token label="component" />
				<Token label="xds" />
			</HStack>
		</MetadataListItem>
		<MetadataListItem label="Priority">Tier 1</MetadataListItem>
	</MetadataList>
}
