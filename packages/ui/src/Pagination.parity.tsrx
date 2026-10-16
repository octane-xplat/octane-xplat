// Measured parity fixtures — assertions live in Pagination.parity.check.ts.
import { Pagination } from './Pagination'
import type { ParityFixture } from './parity'

function PaginationFixture() @{
	<Pagination
		className="parity-pagination-root"
		style={{ width: 220, height: 36, backgroundColor: '#f5f5f5' }}
		page={4}
		pageCount={8}
		siblingCount={0}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'pagination-window', component: 'Pagination', renderer: PaginationFixture, props: {}, width: 240 },
]
