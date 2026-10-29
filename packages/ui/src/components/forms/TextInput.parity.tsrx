// Measured parity fixtures — assertions live in TextInput.parity.check.ts.
import { TextInput } from './TextInput'
import type { ParityFixture } from '../../parity'

function TextInputFixture(props: { value?: string }) @{
	<TextInput
		className="parity-textinput"
		value={props.value}
		placeholder="Name"
		style={{ width: 180, height: 32 }}
	/>
}

function TextInputNaturalFixture(props: { value?: string }) @{
	<TextInput className="parity-textinput" value={props.value} placeholder="Name" />
}

export const PARITY: ParityFixture[] = [
	{ name: 'text-input', component: 'TextInput', renderer: TextInputFixture, props: {} },
	{
		name: 'text-input-filled',
		component: 'TextInput',
		renderer: TextInputFixture,
		props: { value: 'alec@example.com' },
	},
	{
		name: 'text-input-natural',
		component: 'TextInput',
		renderer: TextInputNaturalFixture,
		props: { value: 'alec@example.com' },
		width: 520,
		wide: true,
	},
]
