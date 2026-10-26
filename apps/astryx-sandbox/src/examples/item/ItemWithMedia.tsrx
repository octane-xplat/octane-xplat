// Port of upstream Item/ItemWithMedia.tsx (Astryx 0.6.4, MIT).
import { Avatar, Badge, Icon, Item, Stack, Text } from '@octane-xplat/ui'

export function ItemWithMedia() @{
	<Stack gap={0}>
		<Item startContent={<Avatar name="Ada Lovelace" size="sm" />} label="Ada Lovelace" description="Design systems engineer" endContent={<Badge label="Owner" variant="purple" />} onPress={() => {}} />
		<Item startContent={<Avatar name="Grace Hopper" size="sm" />} label="Grace Hopper" description="Compiler platform" endContent={<Text color="secondary">Online</Text>} onPress={() => {}} />
		<Item startContent={<Icon name="xplat-info" size={16} color="secondary" />} label="Review handoff notes" description="Updated guidance is ready for the team" endContent={<Badge label="New" variant="blue" />} onPress={() => {}} />
	</Stack>
}
