import type { ImageCacheConfig, ImageCacheQueryOptions, ImageCacheState, PrefetchOptions } from './props'
import { createAppKitImageCache } from './cache-bridge.macos'
const cache = createAppKitImageCache()
/** Initialize the renderer's image-owned disk cache. Configuration extensions
 * remain unsupported and fail explicitly rather than silently doing nothing. */
export function initializeImageCache(config?: ImageCacheConfig): void { cache.initialize(config) }
/** HTTP(S) bytes only, without decode. Header-aware warming is unsupported;
 * uncacheable, failed or unwritable responses resolve false. */
export function prefetch(srcs: string | string[], options?: PrefetchOptions): Promise<boolean> { return cache.prefetch(srcs, options) }
export function evictImage(src: string): Promise<boolean> { return cache.evict(src) }
export function clearImageCaches(): Promise<void> { return cache.clear() }
/** Reports decoded memory, otherwise image-owned disk bytes, otherwise none.
 * Unsupported decode-transform queries report none. This is not a shared HTTP
 * cache or sensitive-data purge API. */
export function isImageCached(srcs: string | readonly string[], options?: ImageCacheQueryOptions): Promise<Record<string, ImageCacheState>> { return cache.query(srcs, options) }
