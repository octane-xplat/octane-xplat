// Measured parity fixtures — assertions live in Grid.parity.check.ts.
import { Grid } from './Grid'
import { View } from './View'
import type { ParityFixture } from './parity'

function GridLayoutFixture() @{
	<Grid
		className="parity-grid-root"
		style={{ width: 96, height: 48 }}
		rows="12, auto, *, *"
		columns="30, 2*, *"
	>
		<View className="parity-grid-fixed" row={0} col={0} style={{ width: 30, height: 12 }} />
		<View className="parity-grid-weighted" row={0} col={1} style={{ width: 44, height: 12 }} />
		<View className="parity-grid-auto" row={1} col={0} style={{ width: 30, height: 10 }} />
		<View className="parity-grid-fill" row={3} col={2} style={{ width: 22, height: 13 }} />
		<View className="parity-grid-automatic" style={{ width: 22, height: 12 }} />
		<View
			className="parity-grid-col-span"
			row={1}
			col={1}
			colSpan={2}
			style={{ width: 66, height: 10 }}
		/>
		<View
			className="parity-grid-row-span"
			row={2}
			col={0}
			rowSpan={2}
			style={{ width: 30, height: 26 }}
		/>
	</Grid>
}

export const PARITY: ParityFixture[] = [
	{ name: 'grid-layout', component: 'Grid', renderer: GridLayoutFixture, props: {} },
]
