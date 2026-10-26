// Port of upstream AvatarStatusDot/AvatarStatusDotShowcase.tsx (Astryx 0.6.4, MIT).
import { Avatar, AvatarStatusDot, HStack } from '@octane-xplat/ui'

export function AvatarStatusDotShowcase() @{
	<HStack gap={3} vAlign="center">
		<Avatar name="Ana Thomas" status={<AvatarStatusDot variant="success" label="Online" />} />
		<Avatar name="Drew Young" status={<AvatarStatusDot variant="warning" label="Away" />} />
		<Avatar name="Jihoo Song" status={<AvatarStatusDot variant="error" label="Busy" />} />
		<Avatar name="Nam Tran" status={<AvatarStatusDot variant="neutral" label="Offline" />} />
	</HStack>
}
