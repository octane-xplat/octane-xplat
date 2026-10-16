// Measured parity fixtures — assertions live in SafeArea.parity.check.ts.
import { useSafeAreaInsets } from '@octane-xplat/platform'
import { HStack } from './HStack'
import { SafeArea } from './SafeArea'
import { View } from './View'
import type { ParityFixture } from './parity'

function SafeAreaLayoutFixture() @{
	const insets = useSafeAreaInsets();
	const width = 96;
	const height = 160;
	const contentWidth = width - insets.left - insets.right;
	const contentHeight = height - insets.top - insets.bottom;

	<HStack className="parity-safe-area-fixture" style={{ width: 200, height }} gap={2}>
		<SafeArea className="parity-safe-area-root" style={{ width, height }}>
			<View
				className="parity-safe-area-content"
				style={{ width: contentWidth, height: contentHeight }}
			/>
		</SafeArea>
		<View className="parity-safe-area-reference" style={{ width, height }}>
			<View
				className="parity-safe-area-expected"
				style={{
					width: contentWidth,
					height: contentHeight,
					marginLeft: insets.left,
					marginTop: insets.top,
				}}
			/>
		</View>
	</HStack>
}

export const PARITY: ParityFixture[] = [
	{ name: 'safe-area-layout', component: 'SafeArea', renderer: SafeAreaLayoutFixture, props: {}, height: 168 },
]
