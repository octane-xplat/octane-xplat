// Web host — the Xplat Canvas surface is already a real
// HTMLCanvasElement, so it reaches upstream unchanged. The adapter adds:
// deferred init until positive size, telemetry off by default, abortable
// init, and document-visibility suspension that composes with caller
// pause. Offscreen/detach suspension is upstream's own observers
// (`observeElement`, default on).

import {
	createShader as upstreamCreateShader,
	createSharedDevice as upstreamCreateSharedDevice,
	getWebGPUSupport as upstreamGetWebGPUSupport,
	isWebGPUSupported as upstreamIsWebGPUSupported,
} from 'shaders/js'

import type { CreateShaderOptions, PresetConfig, SharedGpu, ShaderInstance, WebGPUSupportInfo } from './types'
import { resolveOptions, throwIfAborted, waitForPositiveSize, wrapInstance } from './shared'
import type { Size } from './shared'

function measure(canvas: any): Size {
	const rect = canvas?.getBoundingClientRect?.()
	const width = Number(rect?.width) || Number(canvas?.width) || 0
	const height = Number(rect?.height) || Number(canvas?.height) || 0
	return { width, height }
}

function attachVisibility(hide: () => void, show: () => void): () => void {
	const doc = (globalThis as any).document
	if (!doc?.addEventListener) {return () => {}}
	const onChange = () => (doc.visibilityState === 'hidden' ? hide() : show())
	doc.addEventListener('visibilitychange', onChange)
	return () => doc.removeEventListener('visibilitychange', onChange)
}

export async function createShader(
	canvas: unknown,
	preset: PresetConfig,
	options?: CreateShaderOptions,
): Promise<ShaderInstance> {
	const { upstream, signal } = resolveOptions(options, {})
	throwIfAborted(signal)
	await waitForPositiveSize(() => measure(canvas), signal)
	const inner = await upstreamCreateShader(canvas as any, preset, upstream)
	if (signal?.aborted) {
		// Unmounted while the async engine was starting — release the late
		// completion instead of reviving a disposed surface.
		inner.destroy()
		throwIfAborted(signal)
	}

	return wrapInstance(inner, attachVisibility)
}

export function createSharedDevice(options?: { powerPreference?: string }): Promise<SharedGpu | null> {
	return upstreamCreateSharedDevice(options as any)
}

export function isWebGPUSupported(): boolean {
	return upstreamIsWebGPUSupported()
}

export function getWebGPUSupport(): Promise<WebGPUSupportInfo> {
	return upstreamGetWebGPUSupport()
}

export function prefersReducedMotion(): boolean {
	const matchMedia = (globalThis as any).matchMedia
	return typeof matchMedia === 'function' ? !!matchMedia('(prefers-reduced-motion: reduce)').matches : false
}
