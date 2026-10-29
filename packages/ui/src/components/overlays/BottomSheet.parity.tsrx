// Measured parity fixtures — assertions live in BottomSheet.parity.check.ts.
import { BottomSheet } from './BottomSheet'
import { View } from '../layout/View'
import type { ParityFixture } from '../../parity'

function SheetLayoutFixture(props: { marker: string }) @{
	<BottomSheet
		isOpen
		label="Parity sheet"
		hasScrim={false}
		className={props.marker}
		height={80}
		style={{ width: 96, backgroundColor: '#f5f5f5' }}
	>
		<View style={{ width: 96, height: 48 }} />
	</BottomSheet>
}

export const PARITY: ParityFixture[] = [
	{
		name: 'sheet-fixed-frame',
		component: 'BottomSheet',
		renderer: SheetLayoutFixture,
		props: { marker: 'parity-portal--sheet-fixed-frame' },
		height: 112,
	},
]
