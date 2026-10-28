// Measured parity fixtures — assertions live in Tokenizer.parity.check.ts.
import { Tokenizer } from './Tokenizer'
import { createStaticSource } from './typeahead-source'
import type { ParityFixture } from './parity'

function TokenizerFixture() @{
	<Tokenizer
		className="parity-tokenizer-root"
		label="Regions"
		searchSource={createStaticSource([
			{ id: 'east', label: 'East' },
			{ id: 'west', label: 'West' },
		])}
		value={[
			{ id: 'north', label: 'North' },
			{ id: 'south', label: 'South' },
		]}
		onChange={() => {}}
		placeholder="Add a region"
		style={{ width: 220, height: 44, backgroundColor: '#f5f5f5' }}
	/>
}

export const PARITY: ParityFixture[] = [
	{
		name: 'tokenizer-values',
		component: 'Tokenizer',
		renderer: TokenizerFixture,
		props: {},
		wide: true,
	},
]
