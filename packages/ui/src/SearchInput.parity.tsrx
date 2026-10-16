// Measured parity fixtures — assertions live in SearchInput.parity.check.ts.
import { SearchInput } from './SearchInput'
import type { ParityFixture } from './parity'

function SearchInputFixture() @{
	<SearchInput
		className="parity-search-input-root"
		style={{ width: 220, height: 40 }}
		placeholder="Search projects"
		accessibilityLabel="Search projects"
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'search-input-basic', component: 'SearchInput', renderer: SearchInputFixture, props: {} },
]
