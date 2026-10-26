// Port of upstream Avatar/AvatarInteractive.tsx (Astryx 0.6.4, MIT).
import { Avatar, HStack, Stack, Text } from '@octane-xplat/ui'

export function AvatarInteractive() @{
	<Stack direction="horizontal" gap={4} vAlign="center">
		<HStack gap={2} vAlign="center">
			<Avatar name="Itai Jordaan" />
			<Text type="body">Itai Jordaan</Text>
		</HStack>
		<HStack gap={2} vAlign="center">
			<Avatar name="Margot Schroder" />
			<Text type="body">Margot Schroder</Text>
		</HStack>
	</Stack>
}
