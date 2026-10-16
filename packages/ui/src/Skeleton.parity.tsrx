// Measured parity fixtures — assertions live in Skeleton.parity.check.ts.
import { Skeleton } from './Skeleton'
import type { ParityFixture } from './parity'

function SkeletonFixture() @{
	<Skeleton
		className="parity-skeleton-root"
		width={140}
		height={18}
		style={{ backgroundColor: '#dbeafe' }}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'skeleton-basic', component: 'Skeleton', renderer: SkeletonFixture, props: {} },
]
