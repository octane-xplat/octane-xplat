// Port of upstream Avatar/AvatarWithStatus.tsx (Astryx 0.6.4, MIT).
import { Avatar, AvatarStatusDot, HStack } from '@octane-xplat/ui'

export function AvatarWithStatus() @{
	<HStack gap={3} vAlign="center">
		<Avatar name="Ana Thomas" status={<AvatarStatusDot variant="success" label="Online" />} />
		<Avatar name="Drew Young" status={<AvatarStatusDot variant="warning" label="Away" />} />
		<Avatar name="Jihoo Song" status={<AvatarStatusDot variant="neutral" label="Offline" />} />
	</HStack>
}
