// Port of upstream Avatar/AvatarFallbackChain.tsx (Astryx 0.6.4, MIT).
// Upstream src assets don't exist in this port — fallbacks exercise the
// same initials/alt chain.
import { Avatar, HStack, Text, VStack } from '@octane-xplat/ui'

export function AvatarFallbackChain() @{
	<HStack gap={4} vAlign="center">
		<VStack gap={1} hAlign="center">
			<Avatar name="Daniela Gimenez" />
			<Text type="supporting">initials</Text>
		</VStack>
		<VStack gap={1} hAlign="center">
			<Avatar fallback="DG" name="Daniela Gimenez" />
			<Text type="supporting">fallback</Text>
		</VStack>
		<VStack gap={1} hAlign="center">
			<Avatar />
			<Text type="supporting">empty</Text>
		</VStack>
	</HStack>
}
