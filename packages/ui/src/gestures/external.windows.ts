import type { PanGestureOptions } from './types'

export function attachOwnedPan(_host: object, _options: PanGestureOptions): () => void {
  throw new Error('Shared gesture input is unsupported on windows')
}

export function observeOwnedPress(
  _host: object,
  _callbacks: { start(): void; end(): void },
): () => void {
  throw new Error('Shared gesture input is unsupported on windows')
}
