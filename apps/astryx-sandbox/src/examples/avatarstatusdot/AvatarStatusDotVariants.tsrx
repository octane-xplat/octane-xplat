// Port of upstream AvatarStatusDot/AvatarStatusDotVariants.tsx (Astryx 0.6.4, MIT).
import { Avatar, AvatarStatusDot, HStack } from '@octane-xplat/ui'

export function AvatarStatusDotVariants() @{
	<HStack gap={3} vAlign="center">
		<Avatar name="A" status={<AvatarStatusDot variant="success" />} />
		<Avatar name="B" status={<AvatarStatusDot variant="warning" />} />
		<Avatar name="C" status={<AvatarStatusDot variant="error" />} />
		<Avatar name="D" status={<AvatarStatusDot variant="accent" />} />
		<Avatar name="E" status={<AvatarStatusDot variant="neutral" />} />
	</HStack>
}
