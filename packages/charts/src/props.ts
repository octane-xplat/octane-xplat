/** Shared prop/type contract for @octane-xplat/charts — the single source for
 *  both platform leaves and the published .d.ts. No imports: the shared
 *  contract stays dependency-free and platform-agnostic. */

export type ChartType = 'line' | 'area' | 'bar' | 'pie' | 'scatter'

export interface ChartDatum {
	/** Bar/pie: the category label. Line/area/scatter: number or Date. */
	x: number | string | Date
	y: number
	/** Per-datum color override — wins over the series color (pie slices,
	 *  scatter points, individual bars). */
	color?: string
}

export interface SeriesSpec {
	name: string
	/** Series color — stroke for line/scatter, fill for area/bar. Falls back
	 *  to the built-in palette by series index. */
	color?: string
	values: ChartDatum[]
}

export interface ChartMargin {
	top?: number
	right?: number
	bottom?: number
	left?: number
}

/** Axis decomposition — gridline, tick stub, and label toggle independently
 *  (Swift Charts `AxisMarks` shape). Labels render as real positioned
 *  elements in the overlay, never `<text>` in markup. */
export interface AxisSpec {
	/** Tick labels in the margin. Default true. */
	labels?: boolean
	/** Tick stubs on the axis spine. Default true. */
	ticks?: boolean
	/** Gridlines across the plot area. Default false. */
	grid?: boolean
	/** Desired tick count hint — a hint, not a guarantee. */
	tickCount?: number
	/** Tick label formatter; receives the domain value. */
	format?: (value: number | string | Date) => string
}

/** A resolved datum reference — `x`/`y` are the datum's values, not pixels. */
export interface ChartHit {
	series: number
	index: number
	x: number | string | Date
	y: number
}

export interface ChartProps {
	type: ChartType
	data: SeriesSpec[]
	/** Explicit size in px (web) / dips (native). Without `height`, the leaf
	 *  fills its parent or derives height from `aspectRatio`. */
	width?: number
	height?: number
	/** width/height ratio used when `height` is unset. */
	aspectRatio?: number
	/** Space reserved inside the chart box for axis labels — labels live in
	 *  the margin band, the plot in the remainder. Defaults reserve room for
	 *  x labels (bottom) and y labels (left) when those axes show labels. */
	margin?: ChartMargin
	/** Bar only: stack series instead of grouping side by side. */
	stacked?: boolean
	/** Pie only: 0–<1 inner-radius fraction — any positive value renders a
	 *  donut. */
	innerRadiusRatio?: number
	xAxis?: AxisSpec
	yAxis?: AxisSpec
	/** Legend row of series swatches. `true` = 'bottom'. Pie legends list
	 *  slices, not series. */
	legend?: boolean | 'top' | 'bottom'
	/** Show a value callout at the scrub/hover cursor. */
	tooltip?: boolean
	/** Show a snap-to-x cursor rule while scrubbing. */
	crosshair?: boolean
	/** Tap/click a datum. */
	onPress?: (hit: ChartHit) => void
	/** Scrub position changes — `null` when the gesture ends or leaves. */
	onScrub?: (hit: ChartHit | null) => void
	accessibilityLabel?: string
	className?: any
	style?: any
	id?: string
}
