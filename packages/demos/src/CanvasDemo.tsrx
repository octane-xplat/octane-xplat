import { Canvas } from '@octane-xplat/canvas';
import { Heading, Text, View } from '@octane-xplat/ui';
import { useState } from 'octane';
import { draw } from './canvas-wgsl';

/** Shared `Canvas` demo — one WGSL fragment shader rendered through the
 *  WebGPU context on web (navigator.gpu) and native (@nativescript/canvas's
 *  wgpu core over Metal/Vulkan). The plugin arrives as a real dependency
 *  of @octane-xplat/canvas. The render lives in canvas-wgsl.ts — the
 *  universal compiler rejects async functions inside .tsrx files. */
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
