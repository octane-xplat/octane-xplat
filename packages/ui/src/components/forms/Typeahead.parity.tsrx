// Measured parity fixtures — assertions live in Typeahead.parity.check.ts.
import { Typeahead } from './Typeahead'
import { createStaticSource } from './typeahead-source'
import type { ParityFixture } from '../../parity'

function TypeaheadFixture() @{
	<Typeahead
		className="parity-typeahead-root"
		label="Size"
		searchSource={createStaticSource([
			{ id: 'small', label: 'Small' },
			{ id: 'large', label: 'Large' },
		])}
		value={{ id: 'small', label: 'Small' }}
		onChange={() => {}}
		style={{ width: 220, height: 44, backgroundColor: '#f5f5f5' }}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'typeahead-value', component: 'Typeahead', renderer: TypeaheadFixture, props: {} },
]
