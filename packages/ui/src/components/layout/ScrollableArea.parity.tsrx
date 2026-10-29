// Measured parity fixtures — assertions live in ScrollableArea.parity.check.ts.
import { ScrollableArea } from './ScrollableArea'
import { VStack } from './VStack'
import { View } from './View'
import type { ParityFixture } from '../../parity'

function ScrollViewLayoutFixture() @{
	<ScrollableArea className="parity-scroll-root" style={{ width: 96, height: 32 }}>
		<VStack className="parity-scroll-content" style={{ width: 96, height: 64 }} gap={1}>
			<View className="parity-scroll-first" style={{ width: 24, height: 12 }} />
			<View className="parity-scroll-second" style={{ width: 24, height: 12 }} />
		</VStack>
	</ScrollableArea>
}

function ScrollBoxLayoutFixture() @{
	<ScrollableArea
		axis="both"
		className="parity-scrollbox-root"
		style={{ width: 96, height: 48, backgroundColor: '#f5f5f5' }}
	>
		<VStack className="parity-scrollbox-content" style={{ width: 96, height: 64 }} gap={1}>
			<View className="parity-scrollbox-first" style={{ width: 24, height: 12 }} />
			<View className="parity-scrollbox-second" style={{ width: 24, height: 12 }} />
		</VStack>
	</ScrollableArea>
}

export const PARITY: ParityFixture[] = [
	{
		name: 'scroll-view-layout',
		component: 'ScrollableArea',
		renderer: ScrollViewLayoutFixture,
		props: {},
	},
	{
		name: 'scroll-box-layout',
		component: 'ScrollableArea',
		renderer: ScrollBoxLayoutFixture,
		props: {},
	},
]
