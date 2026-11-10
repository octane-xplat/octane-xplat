// Windows leaf — no viewport-tracking backend exists on the Windows host;
// report the capability as unsupported and keep the class contract so
// callers can degrade instead of throwing.
import type {
  IntersectionObserverCallback,
  IntersectionObserverInit,
  IntersectionObserverShape,
} from './types'

export const supported: boolean = false

/** Bounded no-op observer — observe/unobserve/disconnect are safe but
 *  never emit entries. `supported === false` tells callers to use their
 *  fallback path. */
export class IntersectionObserver implements IntersectionObserverShape {
  readonly root: any | null
  readonly rootMargin: string
  readonly thresholds: readonly number[]

  constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
    void callback
    this.root = options.root ?? null
    this.rootMargin = options.rootMargin ?? '0px'
    this.thresholds =
      options.threshold === undefined
        ? [0]
        : Array.isArray(options.threshold)
          ? options.threshold
          : [options.threshold]
  }

  observe(_target: unknown): void {}

  takeRecords(): [] {
    return []
  }

  unobserve(_target: unknown): void {}

  disconnect(): void {}
}
