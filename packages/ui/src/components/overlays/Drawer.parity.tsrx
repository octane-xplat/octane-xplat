// Measured parity fixtures — assertions live in Drawer.parity.check.ts.
import { Drawer } from './Drawer'
import { View } from '../layout/View'
import type { ParityFixture } from '../../parity'

function DrawerLayoutFixture() @{
	<Drawer
		className="parity-drawer-root"
		open
		style={{ width: 320, height: 48, backgroundColor: '#f5f5f5' }}
		main={<View className="parity-drawer-main-content" style={{ width: 320, height: 48 }} />}
		drawer={<View className="parity-drawer-panel-content" style={{ width: 40, height: 48 }} />}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'drawer-open-frame', component: 'Drawer', renderer: DrawerLayoutFixture, props: {} },
]
