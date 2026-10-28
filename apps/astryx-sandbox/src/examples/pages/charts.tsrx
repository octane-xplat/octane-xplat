// Shared chart substitutes for the composed dashboard page templates (unit 12).
// Upstream renders recharts (BarChart/LineChart/ResponsiveContainer). Octane
// ships no public chart package — these helpers draw the same contract as
// inline SVG/HTML: multi-series line charts, single-series sparklines, and
// stacked horizontal bar rows. No axes/gridlines/tooltips are re-created; the
// surrounding cards keep their metric labels. Recorded finding: recharts is a
// private upstream dependency, not an Octane capability gap per se.
import { useMemo } from 'octane'

const SVG_W = 600

export interface LineSeries {
	/** Display name — drives the legend swatch when `legend` is set. */
	name?: string
	/** Sampled values; the line spans evenly across the viewBox. */
	data: readonly number[]
	/** CSS color for the stroke/fill. */
	color: string
	/** Fill the area under the line at 12% opacity (recharts `fillOpacity`). */
	area?: boolean
}

function linePoints(data: readonly number[], min: number, range: number, w: number, h: number) {
	const step = data.length > 1 ? w / (data.length - 1) : 0
	return data
		.map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
		.join(' ')
}

/** Multi-series line chart — preserves the upstream visual contract (lines +
 *  optional area fill) inside a responsive-height box. */
export function ChartLines(props: {
	series: readonly LineSeries[]
	height: number
	legend?: boolean
}) @{
	const h = 200
	const { min, max } = useMemo(() => {
		let lo = Infinity
		let hi = -Infinity
		for (const s of props.series) {
			for (const v of s.data) {
				if (v < lo) {lo = v}
				if (v > hi) {hi = v}
			}
		}
		return { min: lo, max: hi }
	}, [props.series])
	const range = max - min || 1
	const pad = 4

	<div style={{ width: '100%', height: props.height }}>
		<svg
			viewBox={`0 0 ${SVG_W} ${h}`}
			preserveAspectRatio="none"
			style={{ width: '100%', height: '100%', display: 'block' }}
			role="img"
		>
			{props.series.map((s, si) => {
				const pts = linePoints(s.data, min, range, SVG_W - pad * 2, h - pad * 2)
				const shifted = pts
					.split(' ')
					.map((p) => {
						const [x, y] = p.split(',')
						return `${(Number(x) + pad).toFixed(1)},${(Number(y) + pad).toFixed(1)}`
					})
					.join(' ')
				return (
					<g key={si}>
						{s.area ? (
							<polygon
								points={`${pad},${h - pad} ${shifted} ${SVG_W - pad},${h - pad}`}
								fill={s.color}
								fill-opacity="0.12"
							/>
						) : null}
						<polyline
							points={shifted}
							fill="none"
							stroke={s.color}
							stroke-width="2"
							stroke-linejoin="round"
							stroke-linecap="round"
						/>
					</g>
				)
			})}
		</svg>
		{props.legend ? (
			<div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
				{props.series.map((s, si) => (
					<span key={si} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
						<span
							style={{
								display: 'inline-block',
								width: 10,
								height: 10,
								borderRadius: 2,
								backgroundColor: s.color,
							}}
						/>
						{s.name}
					</span>
				))}
			</div>
		) : null}
	</div>
}

/** Single-series sparkline (recharts `height={24|40}` micro charts). */
export function ChartSparkline(props: { data: readonly number[]; color: string; height: number }) @{
	<ChartLines series={[{ data: props.data, color: props.color }]} height={props.height} />
}

/** One stacked horizontal bar (recharts `layout="vertical"` single-row BarChart). */
export function ChartStackedBar(props: {
	segments: readonly { value: number; color: string }[]
	height?: number
}) @{
	const total = props.segments.reduce((sum, s) => sum + s.value, 0) || 1
	<div
		style={{
			display: 'flex',
			width: '100%',
			height: props.height ?? 24,
			borderRadius: 4,
			overflow: 'hidden',
		}}
		role="img"
	>
		{props.segments.map((s, i) => (
			<div
				key={i}
				style={{
					width: `${(s.value / total) * 100}%`,
					height: '100%',
					backgroundColor: s.color,
				}}
			/>
		))}
	</div>
}

/** Vertical bar column chart (recharts `BarChart` categorical). */
export function ChartBars(props: {
	bars: readonly { label: string; value: number; color?: string }[]
	height: number
}) @{
	const max = Math.max(...props.bars.map((b) => b.value), 1)
	<div
		style={{
			display: 'flex',
			alignItems: 'flex-end',
			gap: 4,
			width: '100%',
			height: props.height,
		}}
		role="img"
	>
		{props.bars.map((b, i) => (
			<div
				key={i}
				style={{
					flex: 1,
					height: `${(b.value / max) * 100}%`,
					backgroundColor: b.color ?? 'var(--color-accent-primary, #3b82f6)',
					borderRadius: 2,
					minHeight: 1,
				}}
				title={`${b.label}: ${b.value}`}
			/>
		))}
	</div>
}
