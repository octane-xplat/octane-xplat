// Measured parity fixtures — assertions live in Field.parity.check.ts.
import { TextInput } from './TextInput'
import { Field } from './index.shared'
import type { ParityFixture } from './parity'

function FormFieldFixture() @{
	<Field className="parity-formfield-root" label="Email" isRequired={true} style={{ width: 180, height: 64, backgroundColor: '#f5f5f5' }}>
		<TextInput placeholder="Email" style={{ width: 160, height: 32 }} />
	</Field>
}

export const PARITY: ParityFixture[] = [
	{ name: 'form-field-basic', component: 'Field', renderer: FormFieldFixture, props: {} },
]
