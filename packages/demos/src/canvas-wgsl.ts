import { getGPU } from '@octane-xplat/canvas'

// One WGSL source, three targets: fullscreen triangle, gradient fragment.
export const WGSL = `
@vertex
fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
	var pos = array<vec2f, 3>(
		vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0)
	);
	return vec4f(pos[i], 0.0, 1.0);
}

@fragment
fn fs(@builtin(position) p: vec4f) -> @location(0) vec4f {
	let uv = p.xy / vec2f(300.0, 120.0);
	return vec4f(uv.x, 0.35, 1.0 - uv.x, 1.0);
}
`

export function draw(canvas: any, context: any, report: (status: string) => void) {
	const gpu = getGPU()
	if (!gpu || !context) {
		report('webgpu: unavailable')
		return
	}

	gpu
		.requestAdapter()
		.then((adapter: any) => {
			if (!adapter) {
				report('webgpu: no adapter')
				return null
			}

			return adapter.requestDevice()
		})
		.then((device: any) => {
			if (!device) {
				return
			}

			const format = gpu.getPreferredCanvasFormat()
			context.configure({ device, format, alphaMode: 'opaque' })
			const module = device.createShaderModule({ code: WGSL })
			const pipeline = device.createRenderPipeline({
				layout: 'auto',
				vertex: { module, entryPoint: 'vs' },
				fragment: { module, entryPoint: 'fs', targets: [{ format }] },
				primitive: { topology: 'triangle-list' },
			})

			const encoder = device.createCommandEncoder()
			const pass = encoder.beginRenderPass({
				colorAttachments: [
					{
						view: context.getCurrentTexture().createView(),
						loadOp: 'clear',
						clearValue: { r: 0, g: 0, b: 0, a: 1 },
						storeOp: 'store',
					},
				],
			})

			pass.setPipeline(pipeline)
			pass.draw(3)
			pass.end()
			device.queue.submit([encoder.finish()])
			report(`webgpu: rendered (${format})`)
		})
		.catch((error: unknown) => report(`webgpu: ${error}`))
}
