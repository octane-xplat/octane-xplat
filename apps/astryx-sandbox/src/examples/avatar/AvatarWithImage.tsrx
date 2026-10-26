// Port of upstream Avatar/AvatarWithImage.tsx (Astryx 0.6.4, MIT).
// Upstream image assets are not shipped in this port; name fallbacks keep
// the same shapes/sizes exercised.
import { Avatar, HStack } from '@octane-xplat/ui'

export function AvatarWithImage() @{
	<HStack gap={3} vAlign="center">
		<Avatar name="Ami Pena" />
		<Avatar name="Ana Thomas" />
		<Avatar name="Daniela Gimenez" />
		<Avatar name="Gabriela Fernandez" />
	</HStack>
}
