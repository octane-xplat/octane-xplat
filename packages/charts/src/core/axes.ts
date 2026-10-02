import { format } from 'd3-format'
import { timeFormat } from 'd3-time-format'
import type { ScaleBand, ScaleLinear, ScalePoint, ScaleTime } from 'd3-scale'
import type { AxisSpec } from '../props'
import type { Mark } from './marks'
import type { PlotBox, XScale, XScaleKind, YScale } from './scales'
import { xCenter } from './scales'

/** A positioned text label — rendered as a real element in the overlay,
 *  never as svg `<text>` (androidsvg/SVGKit text is degraded). `x`/`y` is the
 *  box origin in chart space; `width` bounds it for alignment. */
export interface LabelSpec {
	x: number
	y: number
	width: number
	align: 'start' | 'center' | 'end'
	text: string
	axis: 'x' | 'y'
}

export interface AxisModel {
	labels: LabelSpec[]
	/** Spine and tick stubs — painted over marks. */
	frame: Mark[]
	/** Gridlines — painted under marks. */
	grid: Mark[]
}

const AXIS_COLOR = '#9aa3ad'
const GRID_COLOR = '#9aa3ad'
const GRID_OPACITY = 0.22

const si = format('~s')
const plain = format('~g')
const day = timeFormat('%b %d')

/** Default tick label formatting — SI suffixes for big magnitudes, plain
 *  significant digits otherwise, short month-day for dates. */
export function defaultFormat(value: number | string | Date): string {
	if (value instanceof Date) {
		return day(value)
	}

	if (typeof value === 'number') {
		return Math.abs(value) >= 1000 ? si(value) : plain(value)
	}

	return String(value)
}

/** Cap categorical label count so boxes don't collide — keep every nth. */
function thinDomain(domain: string[], plotWidth: number): string[] {
	const maxLabels = Math.max(2, Math.floor(plotWidth / 56))
	if (domain.length <= maxLabels) {
		return domain
	}

	const step = Math.ceil(domain.length / maxLabels)
	return domain.filter((_, i) => i % step === 0)
}

export function xAxisModel(
	kind: XScaleKind,
	scale: XScale,
	spec: AxisSpec | undefined,
	plot: PlotBox,
): AxisModel {
	const labels = spec?.labels !== false
	const stubs = spec?.ticks !== false
	const grid = spec?.grid === true
	const fmt = spec?.format ?? defaultFormat

	const frame: Mark[] = [
		{
			kind: 'line',
			x1: plot.x,
			y1: plot.y + plot.height,
			x2: plot.x + plot.width,
			y2: plot.y + plot.height,
			stroke: AXIS_COLOR,
			strokeWidth: 1,
		},
	]

	const gridMarks: Mark[] = []
	const out: LabelSpec[] = []

	let values: (string | number | Date)[]
	let format: (v: number | string | Date) => string = fmt
	if (kind === 'band' || kind === 'point') {
		values = thinDomain((scale as ScaleBand<string> | ScalePoint<string>).domain(), plot.width)
	} else {
		const continuous = scale as ScaleLinear<number, number> | ScaleTime<number, number>
		const count = spec?.tickCount ?? 6
		values = continuous.ticks(count) as (number | Date)[]
		if (!spec?.format && kind === 'time') {
			const tf = (continuous as ScaleTime<number, number>).tickFormat(count)
			format = (v) => tf(v as Date)
		}
	}

	for (const v of values) {
		const px = plot.x + xCenter(kind, scale, v)
		if (stubs) {
			frame.push({
				kind: 'line',
				x1: px,
				y1: plot.y + plot.height,
				x2: px,
				y2: plot.y + plot.height + 4,
				stroke: AXIS_COLOR,
				strokeWidth: 1,
			})
		}

		if (grid) {
			gridMarks.push({
				kind: 'line',
				x1: px,
				y1: plot.y,
				x2: px,
				y2: plot.y + plot.height,
				stroke: GRID_COLOR,
				strokeOpacity: GRID_OPACITY,
				strokeWidth: 1,
			})
		}

		if (labels) {
			const width = Math.min(72, plot.width / Math.max(1, values.length))
			const boxX = Math.min(
				Math.max(0, px - width / 2),
				Math.max(0, plot.x + plot.width + 8 - width),
			)

			out.push({
				x: boxX,
				y: plot.y + plot.height + 6,
				width,
				align: 'center',
				text: format(v),
				axis: 'x',
			})
		}
	}

	return { labels: out, frame, grid: gridMarks }
}

export function yAxisModel(scale: YScale, spec: AxisSpec | undefined, plot: PlotBox): AxisModel {
	const labels = spec?.labels !== false
	const stubs = spec?.ticks !== false
	const grid = spec?.grid === true
	const fmt = spec?.format ?? defaultFormat

	const frame: Mark[] = [
		{
			kind: 'line',
			x1: plot.x,
			y1: plot.y,
			x2: plot.x,
			y2: plot.y + plot.height,
			stroke: AXIS_COLOR,
			strokeWidth: 1,
		},
	]

	const gridMarks: Mark[] = []
	const out: LabelSpec[] = []

	for (const v of scale.ticks(spec?.tickCount ?? 5)) {
		const py = plot.y + scale(v)
		if (stubs) {
			frame.push({
				kind: 'line',
				x1: plot.x - 4,
				y1: py,
				x2: plot.x,
				y2: py,
				stroke: AXIS_COLOR,
				strokeWidth: 1,
			})
		}

		if (grid) {
			gridMarks.push({
				kind: 'line',
				x1: plot.x,
				y1: py,
				x2: plot.x + plot.width,
				y2: py,
				stroke: GRID_COLOR,
				strokeOpacity: GRID_OPACITY,
				strokeWidth: 1,
			})
		}

		if (labels) {
			out.push({
				x: 0,
				y: py - 6,
				width: Math.max(0, plot.x - 8),
				align: 'end',
				text: fmt(v),
				axis: 'y',
			})
		}
	}

	return { labels: out, frame, grid: gridMarks }
}
