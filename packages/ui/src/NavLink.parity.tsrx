// Measured parity fixtures — assertions live in NavLink.parity.check.ts.
import { NavLink } from './NavLink'
import { Text } from './Text'
import type { ParityFixture } from './parity'

function NavLinkFixture() @{
	<NavLink
		className="parity-navlink-root"
		activeClassName="parity-navlink-active"
		route={{ stack: 'root', name: 'parity', params: {} }}
	>
		<Text>Parity</Text>
	</NavLink>
}

export const PARITY: ParityFixture[] = [
	{ name: 'nav-link-active', component: 'NavLink', renderer: NavLinkFixture, props: {} },
]
