// Measured parity fixtures — assertions live in Tooltip.parity.check.ts.
import { Text } from '../content/Text'
import { Tooltip } from './Tooltip'
import { View } from '../layout/View'
import type { ParityFixture } from '../../parity'

function TooltipFixture() @{
	<Tooltip
		className="parity-tooltip-anchor"
		style={{ width: 180, height: 48, backgroundColor: '#f5f5f5' }}
		trigger={
			<View
				className="parity-tooltip-trigger"
				style={{ width: 72, height: 24, backgroundColor: '#0a0a0a' }}
			/>
		}
		content={<Text>Delayed tooltip</Text>}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'tooltip-trigger', component: 'Tooltip', renderer: TooltipFixture, props: {} },
]
