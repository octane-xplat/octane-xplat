/** @jsxImportSource @octane-xplat/macos-renderer */
import { Chart } from '@octane-xplat/charts'
import type { ProbeContext } from '../../scripts/probe/context'

let presses = 0
export default function ChartsProbe() {
	return <Chart id="probe-chart" type="bar" width={320} height={200}
		data={[{ name: 'Visits', values: [{ x: 'Mon', y: 2 }, { x: 'Tue', y: 5 }, { x: 'Wed', y: 3 }] }]}
		legend tooltip crosshair accessibilityLabel="Visits by day"
		onPress={() => { presses++ }} />
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('probe-chart-tap'))
	const image = ctx.find('probe-chart-image')
	ctx.assert('SVG decoded by NSImage', !!image?.image, true)
	ctx.record('image size', { width: Number(image.image.size.width), height: Number(image.image.size.height) })
	ctx.record('overlay geometry', ctx.inspect('probe-chart-overlay'))
	await ctx.press('probe-chart-tap')
	ctx.assert('center fallback press', presses, 1)
	await ctx.waitFor(() => ctx.find('probe-chart-tooltip'))
	ctx.record('tooltip', ctx.inspect('probe-chart-tooltip'))
}
