// Port of upstream Avatar/AvatarShowcase.tsx (Astryx 0.6.4, MIT).
import { Avatar, AvatarStatusDot, Stack } from '@octane-xplat/ui'

export function AvatarShowcase() @{
	<Stack direction="horizontal" gap={3} vAlign="center">
		<Avatar name="Ana Thomas" status={<AvatarStatusDot variant="success" label="Online" />} />
		<Avatar name="Drew Young" />
		<Avatar name="Jihoo Song" />
		<Avatar name="Nam Tran" status={<AvatarStatusDot variant="error" label="Busy" />} />
	</Stack>
}
