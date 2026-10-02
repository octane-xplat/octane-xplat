import { describe, expect, test } from 'vitest'
import type { ChartProps } from '../src/props'
import { computeScene } from '../src/core/scene'
import { hitLabel, hitTest } from '../src/core/hit'
import { buildXScale, buildYScale, inferXKind, xCenter, yDomain } from '../src/core/scales'

const XY = [
	{
		name: 'alpha',
		values: [
			{ x: 'a', y: 4 },
			{ x: 'b', y: 9 },
			{ x: 'c', y: 2 },
		],
	},
	{
		name: 'beta',
		values: [
			{ x: 'a', y: 6 },
			{ x: 'b', y: 3 },
			{ x: 'c', y: 7 },
		],
	},
]

const LINE = [
	{
		name: 's',
		values: [
			{ x: 0, y: 1 },
			{ x: 1, y: 5 },
			{ x: 2, y: 3 },
			{ x: 3, y: 8 },
		],
	},
]

const PIE = [
	{
		name: 'share',
		values: [
			{ x: 'one', y: 3 },
			{ x: 'two', y: 1 },
		],
	},
]

function sceneFor(props: ChartProps, w = 400, h = 200) {
	const scene = computeScene(props, w, h)
	expect(scene).not.toBeNull()
	return scene!
}

describe('scales', () => {
	test('bar infers band; numeric x infers linear; Date infers time; string infers point', () => {
		expect(inferXKind('bar', XY)).toBe('band')
		expect(inferXKind('line', LINE)).toBe('linear')
		expect(inferXKind('line', [{ name: 's', values: [{ x: new Date(0), y: 1 }] }])).toBe('time')
		expect(inferXKind('scatter', XY)).toBe('point')
	})

	test('band domain is first-seen category order; centers fall mid-band', () => {
		const scale = buildXScale('band', XY, 300)
		expect(scale.domain()).toEqual(['a', 'b', 'c'])
		const a = (scale as any)('a') as number
		const b = (scale as any)('b') as number
		expect(b).toBeGreaterThan(a)
		expect(xCenter('band', scale, 'a')).toBeCloseTo(a + scale.bandwidth() / 2)
	})

	test('y domain pins zero for bar/area, tracks extent for line', () => {
		expect(yDomain(XY, 'bar', false)).toEqual([0, 9])
		expect(
			yDomain(
				[
					{
						name: 's',
						values: [
							{ x: 0, y: 3 },
							{ x: 1, y: 7 },
						],
					},
				],
				'line',
				false,
			),
		).toEqual([3, 7])

		// Stacked sums positive and negative columns independently.
		const stacked = [
			{
				name: 'a',
				values: [
					{ x: 'k', y: 4 },
					{ x: 'z', y: -2 },
				],
			},
			{
				name: 'b',
				values: [
					{ x: 'k', y: 5 },
					{ x: 'z', y: -1 },
				],
			},
		]

		expect(yDomain(stacked, 'bar', true)).toEqual([-3, 9])
	})

	test('y scale maps domain to inverted pixel range', () => {
		const y = buildYScale([0, 10], 100)
		expect(y(0)).toBeCloseTo(100)
		expect(y(10)).toBeCloseTo(0)
	})
})

describe('golden markup', () => {
	for (const type of ['line', 'area', 'bar', 'scatter'] as const) {
		test(`${type} emits a bounded svg document`, () => {
			const scene = sceneFor({ type, data: type === 'bar' ? XY : LINE })
			expect(scene.markup).toMatchSnapshot()
		})
	}

	test('grouped + stacked bars diverge in markup', () => {
		const grouped = sceneFor({ type: 'bar', data: XY })
		const stacked = sceneFor({ type: 'bar', data: XY, stacked: true })
		expect(grouped.markup).toMatchSnapshot()
		expect(stacked.markup).toMatchSnapshot()
		expect(stacked.markup).not.toBe(grouped.markup)
		// grouped: 2 series × 3 categories = 6 rects; stacked same count.
		expect(grouped.markup.match(/<rect/g)?.length).toBe(6)
		expect(stacked.markup.match(/<rect/g)?.length).toBe(6)
	})

	test('pie emits one arc path per slice; donut adds inner radius', () => {
		const pie = sceneFor({ type: 'pie', data: PIE })
		expect(pie.markup).toMatchSnapshot()
		expect(pie.markup.match(/<path/g)?.length).toBe(2)
		const donut = sceneFor({ type: 'pie', data: PIE, innerRadiusRatio: 0.6 })
		expect(donut.markup).not.toBe(pie.markup)
	})

	test('markup stays inside the androidsvg ∩ SVGKit subset', () => {
		for (const type of ['line', 'area', 'bar', 'pie', 'scatter'] as const) {
			const { markup } = sceneFor({ type, data: type === 'pie' ? PIE : XY, yAxis: { grid: true } })
			expect(markup).not.toMatch(
				/<(text|image|filter|mask|pattern|defs|use|foreignObject|radialGradient)/,
			)

			expect(markup).not.toMatch(/(filter|xlink:href)=/)
			expect(markup).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)
		}
	})

	test('axis labels are element specs, never markup text', () => {
		const scene = sceneFor({ type: 'bar', data: XY })
		expect(scene.markup).not.toContain('<text')
		expect(scene.labels.length).toBeGreaterThan(0)
		// X labels sit in the bottom margin; y labels right-align in the left margin.
		const xLabel = scene.labels.find((l) => l.axis === 'x')!
		const yLabel = scene.labels.find((l) => l.axis === 'y')!
		expect(xLabel.y).toBeGreaterThanOrEqual(scene.plot.y + scene.plot.height)
		expect(yLabel.align).toBe('end')
		expect(yLabel.x + yLabel.width).toBeLessThanOrEqual(scene.plot.x)
	})
})

describe('hit math', () => {
	test('snap-to-x picks the nearest category, nearest-y series within it', () => {
		const scene = sceneFor({ type: 'line', data: XY })
		const target = scene.points.find((p) => p.series === 1 && p.index === 2)! // beta 'c' = 7
		// Pointer above and right of the datum still snaps to its x group.
		const hit = hitTest(scene, target.cx + 4, target.cy - 10)
		expect(hit).toMatchObject({ series: 1, index: 2, y: 7 })
	})

	test('pointer far outside the plot misses', () => {
		const scene = sceneFor({ type: 'bar', data: XY })
		expect(hitTest(scene, -60, 100)).toBeNull()
		expect(hitTest(scene, scene.width + 60, 100)).toBeNull()
	})

	test('stacked bar segments hit per-series', () => {
		const scene = sceneFor({ type: 'bar', data: XY, stacked: true })
		// alpha 'b' top edge is lower (smaller y) than beta's segment top.
		const alpha = scene.points.find((p) => p.series === 0 && p.index === 1)!
		const beta = scene.points.find((p) => p.series === 1 && p.index === 1)!
		expect(hitTest(scene, beta.cx, beta.cy)).toMatchObject({ series: 1, index: 1 })
		expect(hitTest(scene, alpha.cx, alpha.cy)).toMatchObject({ series: 0, index: 1 })
	})

	test('scatter gates on distance — empty space misses', () => {
		const scene = sceneFor({ type: 'scatter', data: LINE })
		const p = scene.points[1]
		expect(hitTest(scene, p.cx, p.cy)).toMatchObject({ index: 1 })
		expect(
			hitTest(scene, scene.plot.x + scene.plot.width / 2, scene.plot.y + scene.plot.height / 2),
		).toBeNull()
	})

	test('pie hits resolve by angle; the donut hole misses', () => {
		const scene = sceneFor({ type: 'pie', data: PIE, innerRadiusRatio: 0.5 })
		const pie = scene.pie!
		// First slice starts at 12 o'clock, clockwise.
		const r = (pie.rInner + pie.rOuter) / 2
		const hit = hitTest(scene, pie.cx + r, pie.cy - 0.001) // just right of top → slice 0
		expect(hit).toMatchObject({ series: 0, index: 0 })
		expect(hitTest(scene, pie.cx, pie.cy)).toBeNull() // inside the hole
	})

	test('hitLabel formats series name and value', () => {
		const scene = sceneFor({ type: 'bar', data: XY })
		const hit = hitTest(scene, scene.points[3].cx, scene.points[3].cy)!
		expect(hitLabel(scene, hit)).toBe('beta: 6')
	})
})
