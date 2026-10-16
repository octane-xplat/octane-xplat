// Measured parity fixtures — assertions live in Switch.parity.check.ts.
import { Switch } from './Switch'
import type { ParityFixture } from './parity'

function SwitchFixture(props: { checked: boolean }) @{
	<Switch checked={props.checked} />
}

export const PARITY: ParityFixture[] = [
	{ name: 'switch-off', component: 'Switch', renderer: SwitchFixture, props: { checked: false } },
	{ name: 'switch-on', component: 'Switch', renderer: SwitchFixture, props: { checked: true } },
]
