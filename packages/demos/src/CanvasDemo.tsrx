import { Canvas, getGPU } from '@octane-xplat/canvas';
import { Heading, Text, View } from '@octane-xplat/ui';
import { useState } from 'octane';

// One WGSL source, three targets: fullscreen triangle, gradient fragment.
const WGSL = `
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
`;

async function draw(
	canvas: any,
	context: any,
	report: (status: string) => void,
) {
	try {
		const gpu = getGPU();
		if (!gpu || !context) {
			report('webgpu: unavailable');
			return;
		}

		const adapter = await gpu.requestAdapter();
		if (!adapter) {
			report('webgpu: no adapter');
			return;
		}

		const device = await adapter.requestDevice();
		const format = gpu.getPreferredCanvasFormat();
		context.configure({ device, format, alphaMode: 'opaque' });
		const module = device.createShaderModule({ code: WGSL });
		const pipeline = device.createRenderPipeline({
			layout: 'auto',
			vertex: { module, entryPoint: 'vs' },
			fragment: { module, entryPoint: 'fs', targets: [{ format }] },
			primitive: { topology: 'triangle-list' },
		});

		const encoder = device.createCommandEncoder();
		const pass = encoder.beginRenderPass({
			colorAttachments: [
				{
					view: context.getCurrentTexture().createView(),
					loadOp: 'clear',
					clearValue: { r: 0, g: 0, b: 0, a: 1 },
					storeOp: 'store',
				},
			],
		});

		pass.setPipeline(pipeline);
		pass.draw(3);
		pass.end();
		device.queue.submit([encoder.finish()]);
		report(`webgpu: rendered (${format})`);
	} catch (error) {
		report(`webgpu: ${error}`);
	}
}

/** Shared `Canvas` demo — one WGSL fragment shader rendered through the
 *  WebGPU context on web (navigator.gpu) and native (@nativescript/canvas's
 *  wgpu core over Metal/Vulkan). */
export function CanvasDemo() @{
	const [status, setStatus] = useState('mounting…');

	<View className="gap-4">
		<Heading level={2}>Canvas / WebGPU</Heading>
		<Text>
			The same WGSL fragment shader renders on every target — browser
			WebGPU on web, wgpu over Metal/Vulkan on native. The plugin arrives
			as a real dependency of @octane-xplat/canvas.
		</Text>
		<Canvas
			id="gpu-canvas"
			context="webgpu"
			width={300}
			height={120}
			style={{ width: 300, height: 120 }}
			onReady={({ canvas, context }) => {
				draw(canvas, context, setStatus);
			}}
		/>
		<Text id="gpu-canvas-status">{status}</Text>
	</View>;
}
