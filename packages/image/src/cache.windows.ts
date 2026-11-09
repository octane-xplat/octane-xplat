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

export function isImageCached(
  _src: string,
  _options?: ImageCacheQueryOptions,
): Promise<ImageCacheState> {
  return Promise.resolve({ memory: false, disk: false })
}
