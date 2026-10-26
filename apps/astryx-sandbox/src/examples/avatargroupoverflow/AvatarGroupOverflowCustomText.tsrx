// Port of upstream AvatarGroupOverflow/AvatarGroupOverflowCustomText.tsx (Astryx 0.6.4, MIT).
import { Avatar, AvatarGroup, AvatarGroupOverflow, Stack, Text } from '@octane-xplat/ui'

const members = ['Ana Thomas', 'Drew Young', 'Jihoo Song']

export function AvatarGroupOverflowCustomText() @{
	<Stack direction="vertical" gap={2}>
		<AvatarGroup>
			{members.map((n) => <Avatar key={n} name={n} />)}
			<AvatarGroupOverflow label="+9 teammates" />
		</AvatarGroup>
		<Text type="supporting" color="secondary">Custom overflow label text</Text>
	</Stack>
}
