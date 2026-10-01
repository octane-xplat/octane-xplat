# `@octane-xplat/canvas`

A GPU/canvas surface for Octane xplat apps: the DOM `<canvas>` on web and
`@nativescript/canvas` on iOS/Android — 2D, WebGL/WebGL2, and
WebGPU/WGSL context kinds behind one `getContext` contract.

```sh
pnpm add @octane-xplat/canvas
```

```tsx
import { Canvas, getGPU } from '@octane-xplat/canvas'

;<Canvas
	context="webgl"
	width={640} // numeric size = drawing-buffer/dip size, not display size
	height={480}
	onReady={({ canvas, context }) => {
		// context is null when that kind is unavailable on this target
	}}
/>
```

Pass `context` to have the leaf resolve it before `onReady`, or omit it and
call `getContext` yourself — one kind per canvas, decided on first call.
`onReady` fires after mount on web and on the plugin's `ready` event on
native (earlier `getContext` calls can return null). For WebGPU,
`getGPU()` normalizes adapter/device acquisition across targets.

Per-target limits are recorded in
[known limits](../../docs/known-limits.md). Exercised by
[`CanvasDemo`](../demos/src/CanvasDemo.tsrx) (including a WGSL path).
