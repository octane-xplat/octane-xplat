import { extent } from 'd3-array'
import { scaleBand, scaleLinear, scalePoint, scaleTime } from 'd3-scale'
import type { ScaleBand, ScaleLinear, ScalePoint, ScaleTime } from 'd3-scale'
import type { ChartType, SeriesSpec } from '../props'

export type XScaleKind = 'band' | 'point' | 'linear' | 'time'

export type XScale =
	| ScaleBand<string>
	| ScalePoint<string>
	| ScaleLinear<number, number>
	| ScaleTime<number, number>

export type YScale = ScaleLinear<number, number>

export interface PlotBox {
	x: number
	y: number
	width: number
	height: number
}

export interface ResolvedSeries {
	name: string
	color: string
	values: { x: number | string | Date; y: number; color?: string }[]
}

/** Categorical x values across all series, first-seen order — the band/point
 *  domain. */
export function categoryDomain(data: SeriesSpec[]): string[] {
	const seen = new Set<string>()
	const out: string[] = []
	for (const series of data) {
		for (const d of series.values) {
			const key = String(d.x)
			if (!seen.has(key)) {
				seen.add(key)
				out.push(key)
			}
		}
	}

	return out
}

/** A categorical x lookup — band/point domains key on String(x). */
export function categoryKey(x: number | string | Date): string {
	return String(x)
}

/** Pick the x scale family: bar is always band, other cartesian types infer
 *  from the first datum — Date → time, string → point, number → linear. */
export function inferXKind(type: ChartType, data: SeriesSpec[]): XScaleKind {
	if (type === 'bar') {
		return 'band'
	}

	const first = data[0]?.values[0]?.x
	if (first instanceof Date) {
		return 'time'
	}

	if (typeof first === 'string') {
		return 'point'
	}

	return 'linear'
}

export function buildXScale(kind: XScaleKind, data: SeriesSpec[], width: number): XScale {
	switch (kind) {
		case 'band':
			return scaleBand<string>()
				.domain(categoryDomain(data))
				.range([0, width])
				.paddingInner(0.25)
				.paddingOuter(0.15)
		case 'point': {
			const domain = categoryDomain(data)
			return scalePoint<string>()
				.domain(domain)
				.range([0, width])
				.padding(domain.length <= 1 ? 0 : 0.5)
		}
		case 'time': {
			const values = data.flatMap((s) => s.values.map((d) => d.x as Date))
			const [lo, hi] = extent(values)
			if (lo === undefined || hi === undefined) {
				const now = new Date()
				return scaleTime().domain([now, now]).range([0, width])
			}

			return scaleTime()
				.domain(padDomain(+lo, +hi).map((v) => new Date(v)))
				.range([0, width])
				.nice()
		}
		case 'linear': {
			const values = data.flatMap((s) => s.values.map((d) => Number(d.x)))
			const [lo, hi] = extent(values)
			return scaleLinear()
				.domain(padDomain(lo ?? 0, hi ?? 1))
				.range([0, width])
				.nice()
		}
	}
}

/** Degenerate domains (one value) get a unit pad so the scale still maps
 *  somewhere sensible. */
function padDomain(lo: number, hi: number): [number, number] {
	return lo === hi ? [lo - 0.5, hi + 0.5] : [lo, hi]
}

/** Y domain: bar/area pin the zero baseline; line/scatter take the data
 *  extent; stacked bars sum per category (positive stack only — negative
 *  values in stacked mode stack below zero independently). */
export function yDomain(data: SeriesSpec[], type: ChartType, stacked: boolean): [number, number] {
	if (stacked && type === 'bar') {
		const pos = new Map<string, number>()
		const neg = new Map<string, number>()
		for (const series of data) {
			for (const d of series.values) {
				const key = String(d.x)
				if (d.y >= 0) {
					pos.set(key, (pos.get(key) ?? 0) + d.y)
				} else {
					neg.set(key, (neg.get(key) ?? 0) + d.y)
				}
			}
		}

		const hi = Math.max(0, ...pos.values())
		const lo = Math.min(0, ...neg.values())
		return lo === hi ? [0, 1] : [lo, hi]
	}

	const values = data.flatMap((s) => s.values.map((d) => d.y))
	const [lo, hi] = extent(values)
	const min = lo ?? 0
	const max = hi ?? 1
	if (type === 'bar' || type === 'area') {
		const domain: [number, number] = [Math.min(0, min), Math.max(0, max)]
		return domain[0] === domain[1] ? [0, 1] : domain
	}

	return padDomain(min, max)
}

export function buildYScale(domain: [number, number], height: number): YScale {
	return scaleLinear().domain(domain).range([height, 0]).nice()
}

/** Pixel center of an x value — band offsets by half the band, point and
 *  continuous scales map directly. */
export function xCenter(kind: XScaleKind, scale: XScale, value: number | string | Date): number {
	if (kind === 'band') {
		const band = scale as ScaleBand<string>
		return (band(String(value)) ?? NaN) + band.bandwidth() / 2
	}

	if (kind === 'point') {
		return (scale as ScalePoint<string>)(String(value)) ?? NaN
	}

	return (scale as ScaleLinear<number, number> | ScaleTime<number, number>)(value as never)
}
