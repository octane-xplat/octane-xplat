# Draw a GPU gradient with vgpu

> Add a browser shader to an Octane Xplat screen using the existing Canvas package.

[vgpu](https://github.com/vercel-labs/vgpu) is a graphics library built on
WebGPU, the browser API for running work on the graphics processor. This guide
starts with a colored rectangle. Its **shader** is a small program that chooses
the color of each pixel.

Start with a [running Xplat app](../start/toolchain.md#create-and-run) and a
browser with WebGPU enabled. Open the app on `localhost` during development;
use HTTPS when publishing. This guide targets the browser. The phone integration
is not yet verified, and native desktop drawing is not supported by this guide.

## Install the packages

Run this in your app's folder. Your app owns the vgpu dependency; there is no
additional Xplat vgpu package. The example uses the vgpu 0.6 API.

```sh
bun add @octane-xplat/canvas vgpu@0.6.0
bun add -D @vgpu/wgsl@0.6.0
```

In `vite.config.ts`, add this import and put `wgslVitePlugin()` first in the
existing `plugins` array. Keep the other plugins and configuration. This
turns shader files into the prepared shader objects required by vgpu 0.6.

```ts
import { wgslVitePlugin } from '@vgpu/wgsl/loader-vite'
import { boundary, css, devBridge, octane, tweaks } from 'octane-xplat/vite'

// The starter's plugins array, with the shader plugin added first.
const plugins = [
  wgslVitePlugin(),
  tweaks(),
  css('web'),
  ...octane(),
  boundary('web'),
  devBridge(),
]
```

Create `src/wgsl-env.d.ts` so TypeScript recognizes shader imports:

```ts
/// <reference types="@vgpu/wgsl/wgsl-types" />
```

Create `src/gradient.wgsl`. WGSL is WebGPU's shader language. The two
coordinates run from zero to one across the rectangle; the output supplies
red, green, blue, and opacity values.

```wgsl
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  return vec4f(uv.x, uv.y, 0.4, 1.0);
}
```

## Add the browser drawing

Create `src/GpuGradient.web.tsx`. The browser build selects this file. The
example waits for the canvas to mount, creates the GPU resources, and draws
one frame. It keeps a readable status if WebGPU is unavailable or drawing
fails. Leaving the screen releases the resources, including when device
creation finishes after the screen has closed.

```tsx
/** @jsxImportSource @octane-xplat/jsx/dom */
import { Canvas } from '@octane-xplat/canvas'
import { useEffect, useState } from 'octane'
import { effect, frame, init, surface } from 'vgpu'
import type { Gpu } from 'vgpu'
import shader from './gradient.wgsl'
import './GpuGradient.css'

export function GpuGradient() {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [message, setMessage] = useState('Preparing the gradient…')

  useEffect(() => {
    if (!canvas) return
    let cancelled = false
    let gpu: Gpu | undefined

    async function draw(targetCanvas: HTMLCanvasElement) {
      try {
        const created = await init()
        if (cancelled) {
          created.dispose()
          return
        }
        gpu = created
        created.onError(error => {
          if (!cancelled) setMessage(`Drawing failed: ${error.message}`)
        })
        void created.lost.then(() => {
          if (!cancelled && gpu === created) {
            setMessage('The GPU was lost. Reload to try again.')
          }
        })
        const output = surface(created, targetCanvas, {
          size: [640, 360],
          autoResize: false,
        })
        const gradient = effect(created, shader)
        await gradient.compile(output)
        if (cancelled) return
        frame(created, current => current.pass(output, gradient))
        setMessage('Gradient ready.')
      } catch (error) {
        const failed = gpu
        gpu = undefined
        failed?.dispose()
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : 'Drawing failed.')
        }
      }
    }

    void draw(canvas)
    return () => {
      cancelled = true
      gpu?.dispose()
    }
  }, [canvas])

  return (
    <section>
      <p role="status">{message}</p>
      <Canvas
        className="gpu-gradient"
        width={640}
        height={360}
        onReady={({ canvas }) => setCanvas(canvas)}
      />
    </section>
  )
}
```

Create `src/GpuGradient.css`. This keeps the rectangle inside a narrow screen.
The drawing has a fixed resolution for this first example.

```css
.gpu-gradient {
  display: block;
  width: 100%;
  max-width: 640px;
  height: auto;
  aspect-ratio: 16 / 9;
}
```

The example lets vgpu acquire and configure the WebGPU context. Leave the
Canvas context unset; do not acquire a 2D or WebGL context on the same canvas.
For the Canvas mounting contract, see the [Canvas guide](../packages/package-canvas.md).

```tsx
// vgpu will call canvas.getContext('webgpu') after onReady.
<Canvas onReady={({ canvas }) => setCanvas(canvas)} />
```

## Keep other targets usable

Create `src/GpuGradient.tsx` as the default implementation. It has the same
export and gives phone and native desktop users a description instead of
attempting the browser drawing. See [platform files](../platform/module-resolution.md#file-variants)
for how the build selects these implementations.

```tsx
import { Text } from '@octane-xplat/ui'

export function GpuGradient() {
  return <Text>A colored gradient illustration. GPU drawing is available in the web version.</Text>
}
```

In `src/App.tsrx`, import the component without a platform suffix and place it
inside your existing screen:

```tsx
import { GpuGradient } from './GpuGradient'

// Inside your screen's markup:
<GpuGradient />
```

## Try it

1. Run `bun run dev` in your app's folder and open the printed web address.
2. Open the screen containing the gradient. Expect a rectangle whose red color
   increases from left to right and green increases from top to bottom.
3. Leave the screen, then return. A fresh drawing should appear. If your app
   has no navigation yet, reload the page.

If drawing fails, read the status above the rectangle. Check that the page is
on `localhost` or HTTPS and that WebGPU is enabled in your browser. A browser
can expose WebGPU while failing to acquire a device because of its GPU,
driver, or settings. Keep the descriptive fallback for users who cannot draw.
After a device-loss message, reload to create a new device.

## Phone and desktop boundaries

The existing Canvas package exposes a WebGPU surface and GPU acquisition on
iOS and Android through NativeScript. That alone does not establish vgpu
compatibility. Device creation, sizing, frame presentation, and disposal still
need to be verified together before replacing the phone fallback. Do not move
the browser file into shared code or install the Node backend in a phone app.

The [Canvas package](../packages/package-canvas.md) provides a native WinUI
surface and GPU acquisition on experimental Windows. This vgpu example still
requires its own Windows qualification. Native AppKit Canvas has no drawing
backend. An
app running in a browser or WebView depends on that engine's WebGPU support;
desktop packaging by itself does not provide it. See [known limits](../testing/known-limits.md).

## Continue with vgpu

Follow the upstream [web setup](https://vgpu.sh/docs/get-started/web)
for imports and the [vgpu documentation](https://vgpu.sh) for animation,
compute, and 3D rendering. Those workflows need their own app-level checks.
