// Port of upstream Item/ItemWithMetadata.tsx (Astryx 0.6.4, MIT).
import { Badge, Icon, Item, Stack, Text } from '@octane-xplat/ui'

export function ItemWithMetadata() @{
	<Stack gap={0}>
		<Item startContent={<Icon name="xplat-check" size={16} color="success" />} label="Build passed" description="Production deploy completed" endContent={<Text color="secondary">2m ago</Text>} />
		<Item startContent={<Icon name="xplat-warning" size={16} color="warning" />} label="High memory usage" description="Worker pool is above the warning threshold" endContent={<Badge label="Warning" variant="warning" />} isHighlighted />
		<Item startContent={<Icon name="xplat-error" size={16} color="error" />} label="Sync failed" description="Retry after checking service credentials" endContent={<Badge label="Action" variant="error" />} isSelected />
	</Stack>
}
