// Port of upstream AvatarGroupOverflow/AvatarGroupOverflowShowcase.tsx (Astryx 0.6.4, MIT).
import { Avatar, AvatarGroup, AvatarGroupOverflow, Stack } from '@octane-xplat/ui'

const members = ['Ana Thomas', 'Drew Young', 'Jihoo Song']

export function AvatarGroupOverflowShowcase() @{
	<AvatarGroup>
		{members.map((n) => <Avatar key={n} name={n} />)}
		<AvatarGroupOverflow count={5} />
	</AvatarGroup>
}
