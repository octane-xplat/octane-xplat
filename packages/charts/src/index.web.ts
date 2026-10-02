// Platform barrels — explicit .tsrx leaf specifiers (moduleSuffixes don't
// reach .tsrx; same convention as @octane-xplat/ui index.*.ts).
export { Chart } from './Chart.web.tsrx'
export type {
	AxisSpec,
	ChartDatum,
	ChartHit,
	ChartMargin,
	ChartProps,
	ChartType,
	SeriesSpec,
} from './props'
