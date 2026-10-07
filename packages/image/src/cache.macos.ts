import type { ImageCacheConfig, ImageCacheQueryOptions, ImageCacheState, PrefetchOptions } from './props';

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

export function isImageCached(
	srcs: string | readonly string[],
	_options?: ImageCacheQueryOptions,
): Promise<Record<string, ImageCacheState>> {
	const list = typeof srcs === 'string' ? [srcs] : srcs;
	const states: Record<string, ImageCacheState> = {};
	for (const src of list) {
		states[src] = 'none';
	}

	return Promise.resolve(states);
}
