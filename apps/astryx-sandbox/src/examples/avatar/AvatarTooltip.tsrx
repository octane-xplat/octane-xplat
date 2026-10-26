// Port of upstream Avatar/AvatarTooltip.tsx (Astryx 0.6.4, MIT).
import { Avatar, HStack } from '@octane-xplat/ui'

export function AvatarTooltip() @{
	<HStack gap={2} vAlign="center">
		<Avatar name="Ana Thomas" />
		<Avatar name="Drew Young" />
		<Avatar name="Jihoo Song" />
		<Avatar name="Itai Jordaan" />
	</HStack>
}
