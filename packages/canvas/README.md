# `@octane-xplat/canvas`

A GPU/canvas surface for Octane xplat apps: the DOM `<canvas>` on web and
`@nativescript/canvas` on iOS/Android — 2D, WebGL/WebGL2, and
WebGPU/WGSL context kinds behind one `getContext` contract.

```sh
bun add @octane-xplat/canvas
```

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
iOS/Android (earlier `getContext` calls can return null). For WebGPU,
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

## Keep a fallback when drawing is unavailable

Native macOS/AppKit imports and mounts safely, but drawing is unsupported.
`onReady` reports `context: null` after a neutral frame mounts; it does not
announce a drawing surface. Its unavailable `canvas` handle returns `null`
from `getContext()` for every kind, including `2d`, `webgl`, `webgl2`,
`webgpu`, and `bitmaprenderer`. `getGPU()` also returns `null`, so no adapter
or device can be acquired. Check these results before drawing and keep your
own static fallback. For example, put this component in your app:

```tsx
import { Canvas, getGPU } from '@octane-xplat/canvas'
import { Text, View } from '@octane-xplat/ui'
import { useState } from 'octane'

export function DrawingWithFallback() {
	const [drawn, setDrawn] = useState(false)
	return (
		<View>
			{!drawn && <Text>Blue square illustration</Text>}
			<Canvas
				context="2d"
				width={80}
				height={80}
				onReady={({ canvas, context }) => {
					const drawing = context ?? canvas.getContext('2d')
					if (!drawing) return
					drawing.fillStyle = '#2563eb'
					drawing.fillRect(0, 0, 80, 80)
					setDrawn(true)
				}}
			/>
		</View>
	)
}

// AppKit returns null here, before adapter/device acquisition.
const gpu = getGPU()
```

The AppKit backend for 2D, WebGL, and WebGPU remains deferred until a concrete
consumer needs one and the implementation is approved. Native desktop shader
effects remain unsupported. A DOM webview uses the separate web implementation.

Per-target limits are recorded in
[known limits](https://octane-xplat.goddardai.org/known-limits). Exercised by
[`CanvasDemo`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/demos/src/CanvasDemo.tsrx) (including a WGSL path).
