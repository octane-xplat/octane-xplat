// Measured parity fixtures — assertions live in NavigationMenu.parity.check.ts.
import { NavigationMenu } from './NavigationMenu'
import type { ParityFixture } from '../../parity'

function NavigationMenuFixture() @{
	<NavigationMenu
		className="parity-navmenu-root"
		style={{ width: 220, height: 40, backgroundColor: '#f5f5f5' }}
		items={[
			{ key: 'home', label: 'Home' },
			{ key: 'settings', label: 'Settings', active: true },
		]}
	/>
}

export const PARITY: ParityFixture[] = [
	{
		name: 'navigation-menu-active',
		component: 'NavigationMenu',
		renderer: NavigationMenuFixture,
		props: {},
	},
]
