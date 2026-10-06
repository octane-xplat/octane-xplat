// Native-desktop entry — explicitly unsupported. No engine import, no GPU
// work at module load: this leaf never touches `shaders` at runtime, so
// importing the package on AppKit is inert. `createShader` resolves to a
// no-op instance reporting the upstream-style 'unsupported' failure
// reason so callers keep their static fallback path identical to web's.
export * from './types'
import type { CreateShaderOptions, PresetConfig, SharedGpu, ShaderInstance, WebGPUSupportInfo } from './types'

const UNSUPPORTED: ShaderInstance = {
	getFailureReason: () => 'unsupported',
	update: () => {},
	resize: () => {},
	pause: () => {},
	resume: () => {},
	destroy: () => {},
}

export async function createShader(
	_canvas: unknown,
	_preset: PresetConfig,
	options?: CreateShaderOptions,
): Promise<ShaderInstance> {
	options?.onError?.('unsupported')
	return UNSUPPORTED
}

export async function createSharedDevice(_options?: { powerPreference?: string }): Promise<SharedGpu | null> {
	return null
}

export function isWebGPUSupported(): boolean {
	return false
}

export async function getWebGPUSupport(): Promise<WebGPUSupportInfo> {
	return { supported: false, reason: 'unsupported' }
}

export function prefersReducedMotion(): boolean {
	return false
}
