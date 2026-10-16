// Measured parity fixtures — assertions live in AvatarGroup.parity.check.ts.
import { Avatar } from './Avatar'
import { AvatarGroup } from './AvatarGroup'
import type { ParityFixture } from './parity'

function AvatarGroupFixture() @{
	<AvatarGroup
		className="parity-avatar-group-root"
		max={2}
		size={32}
		style={{ width: 96, height: 40 }}
	>
		<Avatar className="parity-avatar-group-member" fallback="AB" size={32} />
		<Avatar fallback="CD" size={32} />
		<Avatar fallback="EF" size={32} />
	</AvatarGroup>
}

export const PARITY: ParityFixture[] = [
	{ name: 'avatar-group-overflow', component: 'AvatarGroup', renderer: AvatarGroupFixture, props: {} },
]
