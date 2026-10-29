// Measured parity fixtures — assertions live in NavLink.parity.check.ts.
import { NavLink } from './NavLink'
import { Text } from '../content/Text'
import { RouterProvider } from '../../routing/router-hooks.tsrx'
import { createRouter } from '../../routing/router-instance'
import { defineRoute } from '../../routing/define-route'
import { defineRoutes } from '../../routing/route-table'
import type { ParityFixture } from '../../parity'

// A local catalog keeps the fixture independent of an application's registry.
const catalog = defineRoutes([defineRoute({ path: '/parity' }).screen(() => null)])
const route = {
	to: '/parity',
	name: 'parity',
	params: {},
	search: {},
	context: {},
	data: undefined,
	stack: 'root',
	href: '/parity',
}

const navigation = createRouter({
	catalog,
	host: {
		history: 'independent',
		canReset: false,
		getSnapshot: () => ({ route, canGoBack: false, modal: false }),
		subscribe: () => () => {},
		commit: () => ({ status: 'unsupported', operation: 'parity-preview' }),
	},
})

function NavLinkFixture() @{
	<RouterProvider router={navigation}>
		<NavLink
			router={navigation}
			className="parity-navlink-root"
			activeClassName="parity-navlink-active"
			to="/parity"
		>
			<Text>Parity</Text>
		</NavLink>
	</RouterProvider>
}

export const PARITY: ParityFixture[] = [
	{ name: 'nav-link-active', component: 'NavLink', renderer: NavLinkFixture, props: {} },
]
