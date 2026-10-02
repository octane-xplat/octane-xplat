import { scaleBand } from 'd3-scale'
import {
	arc as arcPath,
	area as areaPath,
	curveMonotoneX,
	line as linePath,
	pie as pieLayout,
} from 'd3-shape'

import type { ChartDatum, ChartType } from '../props'
import type { ScaleBand } from 'd3-scale'
import type { PlotBox, ResolvedSeries, XScale, XScaleKind, YScale } from './scales'
import { categoryKey, xCenter } from './scales'

/** Presentation attributes — the androidsvg ∩ SVGKit subset only (fills,
 *  strokes, opacity). No filters, no text, no radial gradients. */
export interface Paint {
	fill?: string
	fillOpacity?: number
	stroke?: string
	strokeOpacity?: number
	strokeWidth?: number
	strokeLinecap?: 'butt' | 'round' | 'square'
}

/** Datum reference — lets the overlay and hit-test map marks back to data. */
interface DatumRef {
	series?: number
	index?: number
}

export type Mark = DatumRef &
	Paint & { transform?: string } & (
		| { kind: 'path'; d: string }
		| { kind: 'rect'; x: number; y: number; width: number; height: number }
		| { kind: 'circle'; cx: number; cy: number; r: number }
		| { kind: 'line'; x1: number; y1: number; x2: number; y2: number }
	)

/** One hit-testable datum position in chart space. */
export interface ScenePoint {
	series: number
	index: number
	/** Snap-to-x group — String(datum.x). */
	key: string
	cx: number
	cy: number
	x: number | string | Date
	y: number
}

export interface PieSlice {
	series: number
	index: number
	label: string
	value: number
	color: string
	startAngle: number
	endAngle: number
	/** Slice centroid relative to the pie center — the tooltip anchor. */
	cx: number
	cy: number
}

export interface PieScene {
	/** Pie center in chart space (plot offset applied by scene.ts). */
	cx: number
	cy: number
	rOuter: number
	rInner: number
	slices: PieSlice[]
}

export interface ChartLayout {
	plot: PlotBox
	xKind: XScaleKind
	x: XScale
	y: YScale
}

export interface BuiltMarks {
	marks: Mark[]
	points: ScenePoint[]
	pie?: PieScene
}

export function buildMarks(
	type: ChartType,
	layout: ChartLayout,
	series: ResolvedSeries[],
	options: { stacked?: boolean; innerRadiusRatio?: number; palette: string[] },
): BuiltMarks {
	switch (type) {
		case 'line':
			return lineMarks(layout, series)
		case 'area':
			return areaMarks(layout, series)
		case 'scatter':
			return scatterMarks(layout, series)
		case 'bar':
			return options.stacked ? stackedBarMarks(layout, series) : groupedBarMarks(layout, series)
		case 'pie':
			return pieMarks(layout, series, options)
	}
}

function lineMarks(layout: ChartLayout, series: ResolvedSeries[]): BuiltMarks {
	const { xKind, x, y } = layout
	const gen = linePath<ChartDatum>()
		.defined((d) => Number.isFinite(d.y))
		.x((d) => xCenter(xKind, x, d.x))
		.y((d) => y(d.y))
		.curve(curveMonotoneX)

	const marks: Mark[] = []
	const points: ScenePoint[] = []
	series.forEach((s, si) => {
		marks.push({
			kind: 'path',
			d: gen(s.values) ?? '',
			fill: 'none',
			stroke: s.color,
			strokeWidth: 2,
			strokeLinecap: 'round',
			series: si,
		})

		s.values.forEach((d, i) => {
			points.push({
				series: si,
				index: i,
				key: categoryKey(d.x),
				cx: xCenter(xKind, x, d.x),
				cy: y(d.y),
				x: d.x,
				y: d.y,
			})
		})
	})

	return { marks, points }
}

function areaMarks(layout: ChartLayout, series: ResolvedSeries[]): BuiltMarks {
	const { xKind, x, y } = layout
	const zero = y(Math.max(y.domain()[0], Math.min(0, y.domain()[1])))
	const gen = areaPath<ChartDatum>()
		.defined((d) => Number.isFinite(d.y))
		.x((d) => xCenter(xKind, x, d.x))
		.y0(zero)
		.y1((d) => y(d.y))
		.curve(curveMonotoneX)

	const stroke = linePath<ChartDatum>()
		.defined((d) => Number.isFinite(d.y))
		.x((d) => xCenter(xKind, x, d.x))
		.y((d) => y(d.y))
		.curve(curveMonotoneX)

	const marks: Mark[] = []
	const points: ScenePoint[] = []
	series.forEach((s, si) => {
		marks.push({
			kind: 'path',
			d: gen(s.values) ?? '',
			fill: s.color,
			fillOpacity: 0.25,
			series: si,
		})

		marks.push({
			kind: 'path',
			d: stroke(s.values) ?? '',
			fill: 'none',
			stroke: s.color,
			strokeWidth: 2,
			series: si,
		})

		s.values.forEach((d, i) => {
			points.push({
				series: si,
				index: i,
				key: categoryKey(d.x),
				cx: xCenter(xKind, x, d.x),
				cy: y(d.y),
				x: d.x,
				y: d.y,
			})
		})
	})

	return { marks, points }
}

function scatterMarks(layout: ChartLayout, series: ResolvedSeries[]): BuiltMarks {
	const { xKind, x, y } = layout
	const marks: Mark[] = []
	const points: ScenePoint[] = []
	series.forEach((s, si) => {
		s.values.forEach((d, i) => {
			const cx = xCenter(xKind, x, d.x)
			const cy = y(d.y)
			marks.push({
				kind: 'circle',
				cx,
				cy,
				r: 3.5,
				fill: d.color ?? s.color,
				fillOpacity: 0.85,
				series: si,
				index: i,
			})

			points.push({ series: si, index: i, key: categoryKey(d.x), cx, cy, x: d.x, y: d.y })
		})
	})

	return { marks, points }
}

function groupedBarMarks(layout: ChartLayout, series: ResolvedSeries[]): BuiltMarks {
	const { x, y } = layout
	const outer = x as ScaleBand<string>
	const inner = scaleBand<string>()
		.domain(series.map((_, i) => String(i)))
		.range([0, outer.bandwidth()])
		.padding(0.08)

	const marks: Mark[] = []
	const points: ScenePoint[] = []
	series.forEach((s, si) => {
		const offset = inner(String(si)) ?? 0
		const width = inner.bandwidth()
		s.values.forEach((d, i) => {
			const band = outer(String(d.x))
			if (band === undefined || !Number.isFinite(d.y)) {
				return
			}

			const top = y(Math.max(0, d.y))
			const bottom = y(Math.min(0, d.y))
			marks.push({
				kind: 'rect',
				x: band + offset,
				y: top,
				width,
				height: Math.max(0, bottom - top),
				fill: d.color ?? s.color,
				series: si,
				index: i,
			})

			points.push({
				series: si,
				index: i,
				key: categoryKey(d.x),
				cx: band + offset + width / 2,
				cy: y(d.y),
				x: d.x,
				y: d.y,
			})
		})
	})

	return { marks, points }
}

/** Stacked bars accumulate per category — positive values stack up from the
 *  baseline, negatives down, so mixed-sign data stays correct. */
function stackedBarMarks(layout: ChartLayout, series: ResolvedSeries[]): BuiltMarks {
	const { x, y } = layout
	const outer = x as ScaleBand<string>
	const posBase = new Map<string, number>()
	const negBase = new Map<string, number>()

	const marks: Mark[] = []
	const points: ScenePoint[] = []
	series.forEach((s, si) => {
		s.values.forEach((d, i) => {
			const cat = String(d.x)
			const band = outer(cat)
			if (band === undefined || !Number.isFinite(d.y)) {
				return
			}

			const v0 = d.y >= 0 ? (posBase.get(cat) ?? 0) : (negBase.get(cat) ?? 0)
			const v1 = v0 + d.y
			if (d.y >= 0) {
				posBase.set(cat, v1)
			} else {
				negBase.set(cat, v1)
			}

			const top = y(Math.max(v0, v1))
			const bottom = y(Math.min(v0, v1))
			marks.push({
				kind: 'rect',
				x: band,
				y: top,
				width: outer.bandwidth(),
				height: Math.max(0, bottom - top),
				fill: d.color ?? s.color,
				series: si,
				index: i,
			})

			points.push({
				series: si,
				index: i,
				key: cat,
				cx: band + outer.bandwidth() / 2,
				cy: y(v1),
				x: d.x,
				y: d.y,
			})
		})
	})

	return { marks, points }
}

/** Pie consumes every datum across series — each {x: label, y: value} is a
 *  slice; slice colors are categorical (palette by order) with datum.color
 *  overrides. A series color is ignored on pie — it would be monochrome. */
function pieMarks(
	layout: ChartLayout,
	series: ResolvedSeries[],
	options: { innerRadiusRatio?: number; palette: string[] },
): BuiltMarks {
	const { plot } = layout
	const flat: { d: ChartDatum; si: number; i: number }[] = []
	series.forEach((s, si) => s.values.forEach((d, i) => flat.push({ d, si, i })))

	// Marks are plot-space; d3 arcs generate around (0,0), so each slice path
	// carries its own translate to the pie center and scene.ts folds the plot
	// offset into the published pie center.
	const cx = plot.width / 2
	const cy = plot.height / 2
	const rOuter = Math.max(0, Math.min(plot.width, plot.height) / 2)
	const ratio = options.innerRadiusRatio ?? 0
	const rInner = rOuter * Math.min(Math.max(ratio, 0), 0.95)

	const arcs = pieLayout<{ d: ChartDatum; si: number; i: number }>()
		.value((v) => Math.max(0, v.d.y))
		.sort(null)(flat)

	const gen = arcPath<any, any>().innerRadius(rInner).outerRadius(rOuter)

	const marks: Mark[] = []
	const slices: PieSlice[] = []
	arcs.forEach((a, order) => {
		// Pie slices are categorical — palette by slice order; a series color on
		// pie would monochrome every slice. datum.color overrides.
		const color = a.data.d.color ?? options.palette[order % options.palette.length]
		const centroid = gen.centroid(a)
		marks.push({
			kind: 'path',
			d: gen(a) ?? '',
			transform: `translate(${cx} ${cy})`,
			fill: color,
			series: a.data.si,
			index: a.data.i,
		})

		slices.push({
			series: a.data.si,
			index: a.data.i,
			label: String(a.data.d.x),
			value: a.data.d.y,
			color,
			startAngle: a.startAngle,
			endAngle: a.endAngle,
			cx: centroid[0],
			cy: centroid[1],
		})
	})

	return { marks, points: [], pie: { cx, cy, rOuter, rInner, slices } }
}
