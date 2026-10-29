// Measured parity fixtures — assertions live in Avatar.parity.check.ts.
import { Avatar } from './Avatar'
import type { ParityFixture } from '../../parity'

function AvatarFixture() @{
	<Avatar
		className="parity-avatar-root"
		fallback="AB"
		alt="Alex Brown"
		size={40}
		style={{ backgroundColor: '#dbeafe' }}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'avatar-fallback', component: 'Avatar', renderer: AvatarFixture, props: {} },
]
