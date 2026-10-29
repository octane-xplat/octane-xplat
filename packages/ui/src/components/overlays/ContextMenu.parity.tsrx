// Measured parity fixtures — assertions live in ContextMenu.parity.check.ts.
import { ContextMenu } from './ContextMenu'
import { View } from '../layout/View'
import type { ParityFixture } from '../../parity'

function ContextMenuFixture() @{
	<ContextMenu
		className="parity-contextmenu-root"
		style={{ width: 180, height: 56, backgroundColor: '#f5f5f5' }}
		items={[{ type: 'action', key: 'copy', label: 'Copy' }]}
	>
		<View className="parity-contextmenu-target" style={{ width: 144, height: 28 }} />
	</ContextMenu>
}

export const PARITY: ParityFixture[] = [
	{
		name: 'context-menu-target',
		component: 'ContextMenu',
		renderer: ContextMenuFixture,
		props: {},
	},
]
