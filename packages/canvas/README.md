# `@octane-xplat/canvas`

```sh
pnpm add @octane-xplat/canvas
```

A GPU/canvas surface for Octane xplat apps: the DOM `<canvas>` on web and
`@nativescript/canvas` on iOS/Android — 2D, WebGL/WebGL2, and
WebGPU/WGSL context kinds behind one `getContext` contract.

```tsx
import { Canvas } from '@octane-xplat/canvas'

export function Drawing() {
	return (
		<Canvas
			context="2d"
			width={640}
			height={480}
			onReady={({ context }) => {
				if (!context) return
				context.fillStyle = '#2563eb'
				context.fillRect(0, 0, 80, 80)
			}}
		/>
	)
}
```

Pass `context` to have the leaf resolve it before `onReady`, or omit it and
call `getContext` yourself — one kind per canvas, decided on first call.
`onReady` fires after mount on web and on the plugin's `ready` event on
native (earlier `getContext` calls can return null). For WebGPU,
`getGPU()` normalizes adapter/device acquisition across targets.

```tsx
import { Canvas, getGPU } from '@octane-xplat/canvas'

export function DeferredCanvas() {
	return (
		<Canvas
			onReady={({ canvas }) => {
				const context = canvas.getContext('2d')
				if (context) context.fillRect(0, 0, 20, 20)
			}}
		/>
	)
}
const gpu = getGPU()
const adapter = await gpu?.requestAdapter()
const device = await adapter?.requestDevice()
```

Per-target limits are recorded in
[known limits](../../docs/verify/known-limits.md). Exercised by
[`CanvasDemo`](../demos/src/CanvasDemo.tsrx) (including a WGSL path).
