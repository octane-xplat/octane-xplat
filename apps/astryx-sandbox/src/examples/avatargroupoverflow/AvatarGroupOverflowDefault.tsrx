// Port of upstream AvatarGroupOverflow/AvatarGroupOverflowDefault.tsx (Astryx 0.6.4, MIT).
import { Avatar, AvatarGroup, AvatarGroupOverflow, Stack } from '@octane-xplat/ui'

const members = ['Ana Thomas', 'Drew Young', 'Jihoo Song']

export function AvatarGroupOverflowDefault() @{
	<Stack direction="vertical" gap={3}>
		<AvatarGroup>
			{members.map((n) => (
				<Avatar key={n} name={n} />
			))}
			<AvatarGroupOverflow count={2} />
		</AvatarGroup>
		<AvatarGroup>
			{members.map((n) => (
				<Avatar key={n} name={n} />
			))}
			<AvatarGroupOverflow count={12} />
		</AvatarGroup>
	</Stack>
}
