// Port of upstream Avatar/AvatarGroup.tsx (Astryx 0.6.4, MIT).
import {
	Avatar,
	AvatarGroup as AvatarGroupPart,
	AvatarGroupOverflow,
	Stack,
	Text,
} from '@octane-xplat/ui'

const team = ['Ada Lovelace', 'Grace Hopper', 'Katherine Johnson', 'Radia Perlman']

export function AvatarGroup() @{
	<Stack direction="vertical" gap={4}>
		<AvatarGroupPart size={40}>
			{team.slice(0, 3).map((name) => (
				<Avatar key={name} name={name} />
			))}
			<AvatarGroupOverflow count={3} />
		</AvatarGroupPart>
		<AvatarGroupPart size={40}>
			{team.map((name) => (
				<Avatar key={name} name={name} />
			))}
			<AvatarGroupOverflow count={8} />
		</AvatarGroupPart>
		<Text type="supporting" color="secondary">
			Grouped avatars with overflow counters
		</Text>
	</Stack>
}
