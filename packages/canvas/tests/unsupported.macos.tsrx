/** @jsxImportSource @octane-xplat/macos-renderer */
import { Canvas, getGPU } from '@octane-xplat/canvas'
import type { CanvasContextKind, CanvasReady } from '@octane-xplat/canvas'
import type { ProbeContext } from '../../../scripts/probe/context'

const kinds: CanvasContextKind[] = ['2d', 'webgl', 'webgl2', 'webgpu', 'bitmaprenderer']
let received: CanvasReady[] = []
const gpuBeforeMount = getGPU()

// The fallback belongs to the caller and exists before any drawing is attempted.
export default function UnsupportedCanvas(props: { context?: CanvasContextKind }) @{
	<masonview style={{display: "grid"}}>
		<label id="canvas-fallback" text="Static illustration" />
		<Canvas id="unsupported-canvas" width={80} height={40}
			context={props.context} onReady={(ready) => received.push(ready)} />
	</masonview>
}

export async function run(ctx: ProbeContext) {
	ctx.assert('WebGPU unavailable before mount', gpuBeforeMount, null)
	for (const kind of [undefined, ...kinds]) {
		received = []
		await ctx.mount(UnsupportedCanvas, { context: kind })
		await ctx.waitFor(() => received.length > 0)
		ctx.assert(`${kind ?? 'deferred'} mount callback once`, received.length, 1)
		const { canvas, context } = received[0]
		ctx.assert(`${kind ?? 'deferred'} resolved context unavailable`, context, null)
		for (const requested of kinds) {
			ctx.assert(`${kind ?? 'deferred'} getContext(${requested}) unavailable`,
				canvas.getContext(requested, {}), null)
		}

		ctx.assert('handle has no device', typeof canvas.device, 'undefined')
		ctx.assert('handle has no adapter acquisition', typeof canvas.requestAdapter, 'undefined')
		ctx.assert('WebGPU remains unavailable after mount', getGPU(), null)
		ctx.assert('caller fallback preserved', ctx.inspect('canvas-fallback').text, 'Static illustration')
		ctx.assert('neutral frame mounted', Boolean(ctx.find('unsupported-canvas')), true)
	}

	ctx.record('drawing', 'unsupported: no surface, contexts, adapter or device')
}
