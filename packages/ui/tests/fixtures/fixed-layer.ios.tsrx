/** @jsxImportSource @octane-xplat/jsx */
import { Screen, Text, useLayer } from '@octane-xplat/ui'
import type { ProbeContext } from '../../../../scripts/probe/context'

let layer: any
export default function FixedLayerProbe() {
	const current = useLayer({ mode: 'fixed', lightDismiss: true })
	layer = current
	return <Screen>
		<Text id="fixed-layer-status">{String(current.isOpen)}</Text>
		{current.render(<Text id="fixed-layer-body">Layer</Text>, { x: 12, y: 20 })}
	</Screen>
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('fixed-layer-status')?.isLoaded)
	layer.show()
	await ctx.waitFor(() => ctx.find('fixed-layer-body')?.isLoaded)
	const body: any = ctx.find('fixed-layer-body')
	const surface = body.parent.parent
	await ctx.waitFor(() => Number(surface.ios.bounds.size.width) > 0)
	const backdrop = surface.ios.subviews.objectAtIndex(0)
	const hostSize = surface.ios.bounds.size
	const backdropSize = backdrop.frame.size
	ctx.record('geometry', { surface: { width: Number(hostSize.width), height: Number(hostSize.height) }, backdrop: { width: Number(backdropSize.width), height: Number(backdropSize.height) } })
	ctx.assert('surface has positive height', Number(hostSize.height) > 0, true)
	ctx.assert('backdrop fills width', Math.abs(Number(backdropSize.width) - Number(hostSize.width)) < 1, true)
	ctx.assert('backdrop fills height', Math.abs(Number(backdropSize.height) - Number(hostSize.height)) < 1, true)
	layer.hide()
	await ctx.waitFor(() => !ctx.find('fixed-layer-body'))
	ctx.assert('layer closes', ctx.inspect('fixed-layer-status').text, 'false')
}
