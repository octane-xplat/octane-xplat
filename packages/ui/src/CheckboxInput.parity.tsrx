// Measured parity fixtures — assertions live in CheckboxInput.parity.check.ts.
import { CheckboxInput } from './index.shared'
import type { ParityFixture } from './parity'

function CheckboxFixture(props: { checked: boolean }) @{
	<CheckboxInput checked={props.checked} />
}

export const PARITY: ParityFixture[] = [
	{ name: 'checkbox-off', component: 'CheckboxInput', renderer: CheckboxFixture, props: { checked: false } },
	{ name: 'checkbox-on', component: 'CheckboxInput', renderer: CheckboxFixture, props: { checked: true } },
]
