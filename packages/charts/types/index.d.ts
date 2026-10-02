// Boundary types for @octane-xplat/charts — the mechanical wrapper over
// props.ts (tsrx-tsc can't emit .tsrx declarations; see ui/types/index.d.ts
// for the same pattern).
import type { UniversalComponent } from 'octane/universal'
import type { ChartProps } from './props.js'

export declare const Chart: UniversalComponent<ChartProps>

export type {
	AxisSpec,
	ChartDatum,
	ChartHit,
	ChartMargin,
	ChartProps,
	ChartType,
	SeriesSpec,
} from './props.js'
