# `@octane-xplat/shaders`

Runs the published [`shaders`](https://www.npmjs.com/package/shaders) WebGPU
engine (pinned `4.0.0`, used unchanged — no vendoring, no shader port) on an
Octane Xplat `Canvas` surface from `@octane-xplat/canvas`. Use it for the
upstream engine's procedural presets — noise, gradients, and other generated
effects. The adapter deliberately does not create a new shader API; it only
adds the surface/lifecycle glue Xplat needs. Preset shapes, effect names,
parameters, options, and the returned instance's methods — `update(id, props)`,
`resize()`, `pause()`, `resume()`, `destroy()`, `getFailureReason()` — are
upstream's.

```sh
pnpm add @octane-xplat/shaders
```

## Usage

```tsx
import { Canvas } from '@octane-xplat/canvas'
import { createShader } from '@octane-xplat/shaders'

<Canvas
	width={320}
	height={180}
	style={{ width: 320, height: 180 }}
	onReady={({ canvas }) => {
		void createShader(canvas, {
			components: [
				{
					id: 'background',
					type: 'SimplexNoise',
					props: { colorA: '#0f172a', colorB: '#7c3aed', scale: 2, seed: 7, speed: 0.5 },
				},
			],
		})
	}}
/>
```

Working demo: `ShaderDemo` in `packages/demos` (parameter updates, pause/resume,
static fallback, reduced-motion still frame, disposal on unmount).

## What the adapter adds

- `createShader(canvas, preset, options?)` — same signature as upstream
  `shaders/js`'s `createShader`, except `canvas` is the Xplat Canvas surface
  (`CanvasReady.canvas`) and options add `signal` (abort deferred/in-flight init;
  a late completion is destroyed, never revived).
- `disableTelemetry` defaults to `true`. Upstream telemetry stays off unless you
  pass `disableTelemetry: false`. No hosted account, preset download, or network
  access is required for local presets.
- Deferred init: until the surface reports a positive size, nothing touches the
  GPU. The static content behind your canvas stays put.
- Host suspension: app backgrounding (NativeScript `suspend`/`resume`), surface
  detach (`loaded`/`unloaded`), and `document` visibility (web) pause rendering —
  without overriding an explicit caller `pause()` when the host returns.
- `createSharedDevice()` — acquire `{ device, adapter }` through the platform
  entry point (`navigator.gpu` on web, the `@nativescript/canvas` GPU shim on
  native) for callers that want to own/share the device via `options.gpu`.
  Instances never destroy a caller-provided or adapter-shared device.
- `isWebGPUSupported()` / `getWebGPUSupport()` — upstream capability helpers,
  native-aware.
- `prefersReducedMotion()` — OS reduced-motion preference; pause after the first
  frame to hold a still, or keep the static fallback.

## Target status

| Target | Status |
| --- | --- |
| Web (DOM) | Implemented. Upstream engine on the browser WebGPU canvas; reached ready + submissions in the headless-Chromium spike (SwiftShader). Hardware GPU correctness, sustained lifecycle, and visual output are unverified — a SwiftShader device-loss observed in the spike was reproduced without the library (raw WebGPU loop) and is attributed to the headless backend, not the package. |
| NativeScript iOS | Implemented, experimental. `@nativescript/canvas` WebGPU (wgpu over Metal). Build/bundle/type verified; device execution pending. |
| NativeScript Android | Implemented, experimental. Same native route over Vulkan. Build/type verified; device/driver execution pending. |
| AppKit macOS / desktop native | Explicitly unsupported. Importing the package is inert (no GPU work, no engine load); `createShader` resolves to a no-op instance with `getFailureReason() === 'unsupported'` so fallback handling is identical. |
| Web code inside a desktop webview | Follows the browser's own WebGPU support; no separate integration. |

Adapter-owned native defaults: `navigator.gpu` is bound lazily to the
`@nativescript/canvas` GPU shim on first use (upstream reads it unconditionally);
`observeElement` defaults off on native (no DOM observers — the view's
`layoutChanged` drives `resize()`); frame pacing uses `requestAnimationFrame`
where the runtime provides it, else upstream's `setTimeout(~16ms)` fallback.

## Limits to know

- **Payload:** the engine is heavy — about **709 KB gzip** (minified browser
  bundle for the JS host + SimplexNoise; ~705 KB via `shaders/core`). Per-effect
  imports do not shrink it because the core renderer pulls the full registry.
  This cost lands only in apps that install this optional package.
- **Upstream packaging defects:** `shaders@4.0.0` declares 34 export subpaths
  that point to absent files (e.g. `./core/RadialLines`, `./core/GradientNoise`).
  `shaders/js`, `shaders/core`, and `shaders/core/SimplexNoise` are intact. Treat
  other subpaths as unverified until you check the file exists. Upstream `.d.ts`
  files also use extensionless relative imports, so they do not resolve under
  `moduleResolution: 'nodenext'` — consumers need bundler-style resolution (all
  Xplat toolchain paths use it).
- **Catalog coverage:** only intact procedural effect definitions without
  browser-only inputs are in the initial native compatibility claim. DOM capture,
  HTML/text-specific facilities, cursor/mouse-driven effects, media sources,
  hosted presets, and simulations may fail on native — upstream reports terminal
  failures via `onError`/`getFailureReason()`; keep the static fallback mounted.
- **Recovery:** device loss uses upstream's own rebuild path (≤3 attempts); there
  is no adapter-level retry loop. Terminal reasons stop rendering permanently.

## Publishing

The package joins the automated lockstep release (non-private `packages/*`). The
one-time npm stub + trusted-publisher setup is still required before the first
release can ship it — see `.agents/docs/releases.md`.
