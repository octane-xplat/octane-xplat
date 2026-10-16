// Measured parity fixtures — assertions live in Kbd.parity.check.ts.
import { Kbd } from './Kbd'
import { Text } from './Text'
import type { ParityFixture } from './parity'

function KbdFixture() @{
	<Kbd
		className="parity-kbd-root"
		style={{ width: 52, height: 32, backgroundColor: '#f5f5f5' }}
	>
		<Text>⌘K</Text>
	</Kbd>
}

export const PARITY: ParityFixture[] = [
	{ name: 'kbd-shortcut', component: 'Kbd', renderer: KbdFixture, props: {} },
]
