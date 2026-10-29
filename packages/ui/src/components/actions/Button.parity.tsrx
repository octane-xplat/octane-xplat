// Measured parity fixtures — assertions live in Button.parity.check.ts.
import { Button } from './Button'
import { Text } from '../content/Text'
import type { ParityFixture } from '../../parity'

function ButtonFixture(props: { width: number; height: number; label: string }) @{
	<Button
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
	</Button>
}

function ButtonNaturalFixture(props: { label: string }) @{
	<Button className="parity-button-natural">
		<Text className="parity-txt">{props.label}</Text>
	</Button>
}

export const PARITY: ParityFixture[] = [
	{
		name: 'button-basic',
		component: 'Button',
		renderer: ButtonFixture,
		props: { width: 220, height: 32, label: 'Go' },
		wide: true,
	},
	{
		name: 'button-compact',
		component: 'Button',
		renderer: ButtonFixture,
		props: { width: 96, height: 28, label: 'Save' },
		wide: true,
	},
	{
		name: 'button-long-label',
		component: 'Button',
		renderer: ButtonFixture,
		props: { width: 160, height: 36, label: 'Continue' },
		wide: true,
	},
	{
		name: 'button-natural',
		component: 'Button',
		renderer: ButtonNaturalFixture,
		props: { label: 'Go' },
		width: 220,
	},
]
