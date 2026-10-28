// Port of upstream Item/ItemShowcase.tsx (Astryx 0.6.4, MIT).
import { Avatar, Badge, Icon, Item, Stack, Text } from '@octane-xplat/ui'

export function ItemShowcase() @{
	<Stack gap={0}>
		<Item
			startContent={<Avatar name="Alice Johnson" size={40} />}
			label="Alice Johnson"
			description="Engineering Lead"
			endContent={<Badge label="Admin" />}
			onPress={() => {}}
		/>
		<Item
			startContent={<Icon name="sandbox-bell" size={16} />}
			label="Build completed successfully"
			description="Pipeline #4521 — all 42 tests passed"
			endContent={<Text color="secondary">5h ago</Text>}
			descriptionLines={1}
			onPress={() => {}}
		/>
		<Item
			startContent={<Icon name="sandbox-document-duplicate" size={16} />}
			label="design-spec.pdf"
			description="Modified 2 hours ago"
			endContent={<Text color="secondary">2.4 MB</Text>}
			isSelected
			onPress={() => {}}
		/>
		<Item
			startContent={<Icon name="sandbox-user" size={16} />}
			label="Compact menu item"
			density="compact"
			onPress={() => {}}
		/>
	</Stack>
}
