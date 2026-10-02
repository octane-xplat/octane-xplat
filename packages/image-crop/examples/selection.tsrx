import { useState } from 'octane'
import { ImageCrop } from '../src/index'
import type { Crop } from '../src/props'
import type { ProbeContext } from '../../../scripts/probe/context'

// A bundled PNG avoids network/image-server dependencies in the probe.
const src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aH1sAAAAASUVORK5CYII='
export default function SelectionDemo() @{
	const [crop, setCrop] = useState<Crop>({ unit: '%', x: 25, y: 25, width: 50, height: 50 })

	<ImageCrop id="crop-demo" src={src} imageWidth={1} imageHeight={1} width={320} height={240}
		crop={crop} aspect={1} minWidth={40} ruleOfThirds onChange={(_, percent) => setCrop(percent)} />
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => !!ctx.find('crop-demo-se'))
	await ctx.waitFor(() => Math.abs((ctx.inspect('crop-demo-move').frame?.width ?? 0) - 120) < 1)
	for (const handle of ['move', 'nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']) {
		ctx.assert('mounted ' + handle, !!ctx.find('crop-demo-' + handle), true)
	}

	const selection = ctx.inspect('crop-demo-move').frame!
	const viewport = ctx.inspect('crop-demo').frame!
	ctx.assert('selection width', selection.width, 120)
	ctx.assert('selection height', selection.height, 120)
	ctx.assert('letterbox x', selection.x - viewport.x, 100)
	ctx.assert('selection y', selection.y - viewport.y, 60)
	ctx.record('selection', selection)
}
