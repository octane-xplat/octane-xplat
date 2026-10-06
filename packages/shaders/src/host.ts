// Native host (iOS/Android via NativeScript) — the Xplat Canvas surface is
// a `@nativescript/canvas` Canvas view. The engine consumes a DOM-canvas
// shape (`style`, `getBoundingClientRect`, `width`/`height` buffer
// writes), so the view is wrapped in a facade that delegates `getContext`
// and swallows style/buffer writes instead of resizing the view.
//
// Adapter-owned native defaults:
// - `navigator.gpu` is lazily bound to the plugin's GPU shim on first use
//   (never at import) so upstream's own acquisition, capability checks and
//   device-loss recovery work unchanged.
// - `observeElement` defaults off: there is no DOM
//   ResizeObserver/IntersectionObserver; sizing is driven by the view's
//   `layoutChanged` event and forwarded to `instance.resize()`.
// - App suspend/resume and view unload/load map to host suspension.
//
// Frame pacing falls back to upstream's `setTimeout(16)` loop when the
// runtime lacks `requestAnimationFrame`. Experimental: iOS/Android device
// verification is still pending.

import { Application, View, isAndroid, isIOS } from '@nativescript/core'
import { getGPU } from '@octane-xplat/canvas'
import {
	createShader as upstreamCreateShader,
	createSharedDevice as upstreamCreateSharedDevice,
	getWebGPUSupport as upstreamGetWebGPUSupport,
	isWebGPUSupported as upstreamIsWebGPUSupported,
} from 'shaders/js'

import type { CreateShaderOptions, PresetConfig, SharedGpu, ShaderInstance, WebGPUSupportInfo } from './types'
import { resolveOptions, throwIfAborted, waitForPositiveSize, wrapInstance } from './shared'
import type { Size } from './shared'

let gpuShim: any
let gpuResolved = false

/** The plugin's GPU shim is also installed as `navigator.gpu` — upstream
 *  (and TypeGPU's `configureContext`) reads it unconditionally. */
function ensureGpu(): any {
	if (!gpuResolved) {
		gpuResolved = true
		try {
			gpuShim = getGPU()
		} catch {
			gpuShim = null
		}
	}

	const gpu = gpuShim
	if (!gpu) {return null}
	const g = globalThis as any
	try {
		if (!g.navigator) {g.navigator = {}}
		if (!g.navigator.gpu) {
			try {
				g.navigator.gpu = gpu
			} catch {
				Object.defineProperty(g.navigator, 'gpu', { configurable: true, value: gpu })
			}
		}
	} catch {
		// `navigator` may be a read-only global — injected `gpu` still applies.
	}

	return gpu
}

function measure(view: any): Size {
	const rect = view?.getBoundingClientRect?.()
	const actual = view?.getActualSize?.()
	const width = Number(rect?.width) || Number(actual?.width) || Number(view?.width) || 0
	const height = Number(rect?.height) || Number(actual?.height) || Number(view?.height) || 0
	return { width, height }
}

/** DOM-canvas-shaped facade over the plugin view. `width`/`height` writes
 *  (upstream's drawing-buffer bookkeeping) are stored locally so the
 *  plugin view's layout size is never mutated by buffer pixel counts. */
function hostCanvas(view: any): any {
	const bag = { style: {} as Record<string, string>, width: 0, height: 0 }
	return {
		getContext: (kind: string, options?: any) => view.getContext(kind, options),
		getBoundingClientRect: () => {
			const { width, height } = measure(view)
			return { x: 0, y: 0, top: 0, left: 0, right: width, bottom: height, width, height }
		},
		get clientWidth() {
			return measure(view).width
		},
		get clientHeight() {
			return measure(view).height
		},
		get width() {
			return bag.width || measure(view).width
		},
		set width(value: number) {
			bag.width = value
		},
		get height() {
			return bag.height || measure(view).height
		},
		set height(value: number) {
			bag.height = value
		},
		get style() {
			return bag.style
		},
		parentElement: null,
	}
}

async function acquireInjectedGpu(): Promise<SharedGpu | null> {
	const gpu = ensureGpu()
	if (!gpu?.requestAdapter) {return null}
	try {
		const adapter = await gpu.requestAdapter()
		if (!adapter) {return null}
		const device = await adapter.requestDevice()
		return device ? { device, adapter } : null
	} catch {
		return null
	}
}

export async function createShader(
	canvas: unknown,
	preset: PresetConfig,
	options?: CreateShaderOptions,
): Promise<ShaderInstance> {
	const { upstream, signal } = resolveOptions(options, { observeElement: false })
	throwIfAborted(signal)
	const host = hostCanvas(canvas)
	await waitForPositiveSize(() => measure(canvas), signal)
	// Adapter-acquired device (shared default when the caller supplies no
	// `gpu`) — never destroyed by the adapter, so one instance's destroy
	// cannot kill another's shared device.
	if (!upstream.gpu) {
		const gpu = await acquireInjectedGpu()
		if (gpu) {upstream.gpu = gpu}
	}

	throwIfAborted(signal)
	const inner = await upstreamCreateShader(host, preset, upstream as any)
	if (signal?.aborted) {
		inner.destroy()
		throwIfAborted(signal)
	}

	const view = canvas as any
	const attach = (hide: () => void, show: () => void) => {
		const onLayout = () => inner.resize()
		Application.on(Application.suspendEvent, hide)
		Application.on(Application.resumeEvent, show)
		view?.on?.(View.unloadedEvent, hide)
		view?.on?.(View.loadedEvent, show)
		view?.on?.(View.layoutChangedEvent, onLayout)
		return () => {
			Application.off(Application.suspendEvent, hide)
			Application.off(Application.resumeEvent, show)
			view?.off?.(View.unloadedEvent, hide)
			view?.off?.(View.loadedEvent, show)
			view?.off?.(View.layoutChangedEvent, onLayout)
		}
	}

	return wrapInstance(inner, attach)
}

export async function createSharedDevice(options?: { powerPreference?: string }): Promise<SharedGpu | null> {
	ensureGpu()
	return upstreamCreateSharedDevice(options as any)
}

export function isWebGPUSupported(): boolean {
	ensureGpu()
	return upstreamIsWebGPUSupported()
}

export function getWebGPUSupport(): Promise<WebGPUSupportInfo> {
	ensureGpu()
	return upstreamGetWebGPUSupport()
}

export function prefersReducedMotion(): boolean {
	try {
		if (isIOS) {
			const check = (globalThis as any).UIAccessibilityIsReduceMotionEnabled
			return typeof check === 'function' ? !!check() : false
		}

		if (isAndroid) {
			const context = Application.android?.context
			const settings = (globalThis as any).android?.provider?.Settings
			if (!context || !settings?.Global) {return false}
			const scale = settings.Global.getFloat(
				context.getContentResolver(),
				settings.Global.ANIMATOR_DURATION_SCALE,
				1,
			)

			return scale === 0
		}
	} catch {}

	return false
}
