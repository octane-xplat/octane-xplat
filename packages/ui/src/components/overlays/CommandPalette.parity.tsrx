// Measured parity fixtures — assertions live in CommandPalette.parity.check.ts.
import { CommandPalette } from './CommandPalette'
import type { ParityFixture } from '../../parity'

function CommandPaletteFixture() @{
	<CommandPalette
		className="parity-portal--command-palette-open"
		style={{ width: 200, height: 96, backgroundColor: '#f5f5f5' }}
		open={true}
		placeholder="Search actions"
		items={[{ key: 'create', label: 'Create project' }]}
	/>
}

export const PARITY: ParityFixture[] = [
	{
		name: 'command-palette-open',
		component: 'CommandPalette',
		renderer: CommandPaletteFixture,
		props: {},
		height: 112,
	},
]
