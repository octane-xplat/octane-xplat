// Windows leaf — no GPU canvas backend exists on the Windows host.
// Contract-preserving bounded results: unsupported flags, rejected
// creation calls, and reduced-motion off.
import type {
  CreateShaderOptions,
  ShaderInstance,
  WebGPUSupportInfo,
} from './types'

const unsupported = (): Error =>
  new Error('unsupported: shaders is not available on windows')

export async function createShader(
  _target: unknown,
  _options?: CreateShaderOptions,
): Promise<ShaderInstance> {
  throw unsupported()
}

export async function createSharedDevice(_options?: {
  onLost?: (reason: string) => void
}): Promise<ShaderInstance> {
  throw unsupported()
}

export function isWebGPUSupported(): boolean {
  return false
}

export function getWebGPUSupport(): Promise<WebGPUSupportInfo> {
  return Promise.resolve({ supported: false } as WebGPUSupportInfo)
}

export function prefersReducedMotion(): boolean {
  return false
}
