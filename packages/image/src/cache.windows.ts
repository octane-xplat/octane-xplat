// Image cache — Windows leaf. The ui-image pipeline has no Windows backend;
// keep the API contract with explicit bounded results.
import type {
  ImageCacheConfig,
  ImageCacheQueryOptions,
  ImageCacheState,
  PrefetchOptions,
} from './props'

export function initializeImageCache(_config?: ImageCacheConfig): void {}

export function prefetch(_srcs: string | string[], _options?: PrefetchOptions): Promise<boolean> {
  return Promise.resolve(false)
}

export function evictImage(_src: string): Promise<boolean> {
  return Promise.resolve(false)
}

export function clearImageCaches(): Promise<void> {
  return Promise.resolve()
}

/** Always 'none' — no pipeline exists on Windows. Returns the same
 *  `Record` shape as the other leaves, keyed by each requested URL. */
export function isImageCached(
  srcs: string | readonly string[],
  _options?: ImageCacheQueryOptions,
): Promise<Record<string, ImageCacheState>> {
  const list = typeof srcs === 'string' ? [srcs] : srcs
  const states: Record<string, ImageCacheState> = {}

  for (const src of list) {
    states[src] = 'none'
  }

  return Promise.resolve(states)
}
