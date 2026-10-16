// Measured parity fixtures — assertions live in User.parity.check.ts.
import { User } from './User'
import type { ParityFixture } from './parity'

function UserFixture() @{
	<User
		className="parity-user-root"
		name="Alex Brown"
		description="Design lead"
		fallback="AB"
		size={40}
		style={{ width: 220, height: 56, backgroundColor: '#f5f5f5' }}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'user-row', component: 'User', renderer: UserFixture, props: {} },
]
