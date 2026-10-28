// Port of upstream AvatarGroup/AvatarGroupShowcase.tsx (Astryx 0.6.4, MIT).
import { Avatar, AvatarGroup, AvatarGroupOverflow, Stack } from '@octane-xplat/ui'

const members = ['Sam Rivera', 'Jordan Lee', 'Alex Johnson', 'Casey Kim']

export function AvatarGroupShowcase() @{
	<Stack direction="vertical" gap={4}>
		<AvatarGroup>
			{members.map((n) => (
				<Avatar key={n} name={n} />
			))}
		</AvatarGroup>
		<AvatarGroup max={2}>
			{members.map((n) => (
				<Avatar key={n} name={n} />
			))}
		</AvatarGroup>
		<AvatarGroup max={3}>
			{members.map((n) => (
				<Avatar key={n} name={n} />
			))}
			<AvatarGroupOverflow count={5} />
		</AvatarGroup>
	</Stack>
}
