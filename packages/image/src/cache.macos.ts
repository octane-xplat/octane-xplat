import type { ImageCacheConfig, ImageCacheState, PrefetchOptions } from './props';

/** No-op — the AppKit host has no image engine. */
export function initializeImageCache(_config?: ImageCacheConfig): void {}

/** No-op — the AppKit host has no image pipeline to warm, so nothing is
 *  prefetched; resolves `false` to report that honestly. */
export function prefetch(_srcs: string | string[], _options?: PrefetchOptions): Promise<boolean> {
	return Promise.resolve(false);
}

export function evictImage(_src: string): Promise<boolean> {
	return Promise.resolve(false);
}

export function clearImageCaches(): Promise<void> {
	return Promise.resolve();
}

export function isImageCached(_src: string): Promise<ImageCacheState> {
	return Promise.resolve('none');
}
