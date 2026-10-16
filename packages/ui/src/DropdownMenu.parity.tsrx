// Measured parity fixtures — assertions live in DropdownMenu.parity.check.ts.
import { DropdownMenu } from './DropdownMenu'
import { Text } from './Text'
import type { ParityFixture } from './parity'

function DropdownMenuFixture() @{
	<DropdownMenu
		className="parity-dropdown-trigger"
		style={{ width: 160, height: 32, backgroundColor: '#f5f5f5' }}
		trigger={<Text>Actions</Text>}
		items={[{ type: 'action', key: 'edit', label: 'Edit' }, { type: 'action', key: 'delete', label: 'Delete' }]}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'dropdown-menu-trigger', component: 'DropdownMenu', renderer: DropdownMenuFixture, props: {} },
]
