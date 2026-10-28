// Measured parity fixtures — assertions live in FieldGroup.parity.check.ts.
import { FieldGroup } from './FieldGroup'
import { TextInput } from './TextInput'
import type { ParityFixture } from './parity'

function FieldGroupFixture() @{
	<FieldGroup
		className="parity-fieldgroup-root"
		label="Contact"
		style={{ width: 180, height: 64, backgroundColor: '#f5f5f5' }}
	>
		<TextInput placeholder="Email" style={{ width: 160, height: 32 }} />
	</FieldGroup>
}

export const PARITY: ParityFixture[] = [
	{ name: 'field-group-basic', component: 'FieldGroup', renderer: FieldGroupFixture, props: {} },
]
