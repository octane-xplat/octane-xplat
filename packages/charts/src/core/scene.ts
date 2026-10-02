import type { ChartProps } from '../props'
import { xAxisModel, yAxisModel } from './axes'
import type { LabelSpec } from './axes'
import { buildMarks } from './marks'
import type { Mark, PieScene, ScenePoint } from './marks'
import { buildXScale, buildYScale, inferXKind, yDomain } from './scales'
import type { PlotBox } from './scales'
import { svgDocument } from './svg'

/** Default categorical palette — Tableau 10, embedded so the leaf stays free
 *  of d3-scale-chromatic. */
export const PALETTE = [
	'#4e79a7',
	'#f28e2b',
	'#e15759',
	'#76b7b2',
	'#59a14f',
	'#edc948',
	'#b07aa1',
	'#ff9da7',
	'#9c755f',
	'#bab0ac',
]

export interface LegendItem {
	color: string
	text: string
}

/** The fully-resolved chart: svg markup, overlay label boxes, legend items,
 *  and per-datum hit targets in chart space. `computeScene` is the core's one
 *  entry point — the leaves only render it. */
export interface ChartScene {
	type: ChartProps['type']
	width: number
	height: number
	plot: PlotBox
	markup: string
	labels: LabelSpec[]
	legend: LegendItem[]
	series: { name: string; color: string }[]
	points: ScenePoint[]
	pie: PieScene | null
}

export function computeScene(props: ChartProps, width: number, height: number): ChartScene | null {
	if (!(width > 0) || !(height > 0) || !props.data?.length) {
		return null
	}

	const pie = props.type === 'pie'
	const xLabels = !pie && props.xAxis?.labels !== false
	const yLabels = !pie && props.yAxis?.labels !== false
	const margin = {
		top: 8,
		right: 10,
		bottom: pie ? 8 : xLabels ? 26 : 10,
		left: pie ? 8 : yLabels ? 46 : 10,
		...props.margin,
	}

	const plot: PlotBox = {
		x: margin.left,
		y: margin.top,
		width: Math.max(0, width - margin.left - margin.right),
		height: Math.max(0, height - margin.top - margin.bottom),
	}

	if (!(plot.width > 0) || !(plot.height > 0)) {
		return null
	}

	const series = props.data.map((s, i) => ({
		name: s.name,
		color: s.color ?? PALETTE[i % PALETTE.length],
		values: s.values,
	}))

	let marks: Mark[]
	let points: ScenePoint[]
	let pieScene: PieScene | null = null
	let labels: LabelSpec[] = []
	let grid: Mark[] = []
	let frame: Mark[] = []

	if (pie) {
		const built = buildMarks(
			'pie',
			// Pie doesn't consume the cartesian scales — placeholders only.
			{ plot, xKind: 'band', x: buildXScale('band', [], 0), y: buildYScale([0, 1], 1) },
			series,
			{ innerRadiusRatio: props.innerRadiusRatio, palette: PALETTE },
		)

		marks = built.marks
		points = []
		const center = { cx: built.pie!.cx + plot.x, cy: built.pie!.cy + plot.y }
		pieScene = {
			...built.pie!,
			...center,
			slices: built.pie!.slices.map((s) => ({ ...s, cx: s.cx + center.cx, cy: s.cy + center.cy })),
		}
	} else {
		const xKind = inferXKind(props.type, props.data)
		const layout = {
			plot,
			xKind,
			x: buildXScale(xKind, props.data, plot.width),
			y: buildYScale(yDomain(props.data, props.type, props.stacked === true), plot.height),
		}

		const built = buildMarks(props.type, layout, series, {
			stacked: props.stacked,
			palette: PALETTE,
		})

		marks = built.marks
		// Marks stay plot-space in the markup (the serializer wraps them in a
		// translate group); hit targets publish chart space.
		points = built.points.map((p) => ({ ...p, cx: p.cx + plot.x, cy: p.cy + plot.y }))

		const xAxis = xAxisModel(xKind, layout.x, props.xAxis, plot)
		const yAxis = yAxisModel(layout.y, props.yAxis, plot)
		labels = [...xAxis.labels, ...yAxis.labels]
		grid = [...xAxis.grid, ...yAxis.grid]
		frame = [...xAxis.frame, ...yAxis.frame]
	}

	const legend = pieScene
		? pieScene.slices.map((s) => ({ color: s.color, text: s.label }))
		: series.map((s) => ({ color: s.color, text: s.name }))

	return {
		type: props.type,
		width,
		height,
		plot,
		markup: svgDocument(marks, grid, frame, plot, width, height),
		labels,
		legend,
		series,
		points,
		pie: pieScene,
	}
}
