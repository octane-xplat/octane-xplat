// Measured parity fixtures — assertions live in Pressable.parity.check.ts.
import { Pressable } from './Pressable'
import { Text } from './Text'
import type { ParityFixture } from './parity'

function PressableFixture(props: { width: number; height: number; label: string }) @{
	<Pressable
		className="parity-pressable"
		onPress={() => {}}
		alignItems="center"
		justifyContent="center"
		style={{
			width: props.width,
			height: props.height,
			padding: 4,
			backgroundColor: '#f5f5f5',
			borderWidth: 1,
			borderColor: '#666666',
			borderRadius: 4,
		}}
	>
		<Text className="parity-txt">{props.label}</Text>
	</Pressable>
}

export const PARITY: ParityFixture[] = [
	{
		name: 'pressable-basic',
		component: 'Pressable',
		renderer: PressableFixture,
		props: { width: 220, height: 32, label: 'Go' },
		wide: true,
	},
]
