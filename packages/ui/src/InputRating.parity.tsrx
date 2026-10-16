// Measured parity fixtures — assertions live in InputRating.parity.check.ts.
import { InputRating } from './InputRating'
import type { ParityFixture } from './parity'

function InputRatingFixture() @{
	<InputRating
		className="parity-rating-root"
		value={3}
		max={5}
		style={{ width: 200, height: 32, backgroundColor: '#f5f5f5' }}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'input-rating-selected', component: 'InputRating', renderer: InputRatingFixture, props: {} },
]
