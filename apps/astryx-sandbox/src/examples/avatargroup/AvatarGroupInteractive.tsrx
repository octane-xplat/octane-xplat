// Port of upstream AvatarGroup/AvatarGroupInteractive.tsx (Astryx 0.6.4, MIT).
import { Avatar, AvatarGroup, AvatarGroupOverflow, Stack, Text } from '@octane-xplat/ui'

const members = ['Sam Rivera', 'Jordan Lee', 'Alex Johnson', 'Casey Kim', 'Riley Chen']

export function AvatarGroupInteractive() @{
	<Stack direction="vertical" gap={2}>
		<AvatarGroup size={32}>
			{members.map((name) => <Avatar key={name} name={name} />)}
			<AvatarGroupOverflow count={4} />
		</AvatarGroup>
		<Text type="supporting" color="secondary">{members.length} members + 4 more</Text>
	</Stack>
}
