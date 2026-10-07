import type { ImageCacheConfig, ImageCacheState } from './props';

/** No-op — the browser owns its HTTP cache; there is no sizing API. */
export function initializeImageCache(_config?: ImageCacheConfig): void {}

/** Warm the browser HTTP cache for `src`. Decode still happens at display —
 *  matching the native disk-prefetch contract. */
export function prefetchImage(src: string): Promise<void> {
	const image = new globalThis.Image();
	image.src = src;
	return Promise.resolve();
}

/** No-op — browsers expose no per-URL cache eviction for <img>. */
export function evictImage(_src: string): Promise<boolean> {
	return Promise.resolve(false);
}

/** No-op — browsers expose no cache clearing for <img>. */
export function clearImageCaches(): Promise<void> {
	return Promise.resolve();
}

/** Always 'none' — the browser cache is not queryable. */
export function isImageCached(_src: string): Promise<ImageCacheState> {
	return Promise.resolve('none');
}
