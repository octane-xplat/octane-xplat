import { prefetchBatch } from './prefetch-batch';
import type { ImageCacheConfig, ImageCacheQueryOptions, ImageCacheState, PrefetchOptions } from './props';

/** No-op — the browser owns its HTTP cache; there is no sizing API. */
export function initializeImageCache(_config?: ImageCacheConfig): void {}

/** Warm the browser HTTP cache by loading each `src` through a throwaway
 *  <img> — the response must land (`load`/`error` awaited) before the promise
 *  resolves. Decode still happens at display, matching the native
 *  disk-prefetch contract. `options.headers` is ignored — an <img> request
 *  cannot carry custom headers. Resolves `false` when any URL fails. */
export function prefetch(srcs: string | string[], options?: PrefetchOptions): Promise<boolean> {
	return prefetchBatch(
		srcs,
		options?.concurrency,
		(url) =>
			new Promise<boolean>((resolve) => {
				const image = new globalThis.Image();
				image.onload = () => resolve(true);
				image.onerror = () => resolve(false);
				image.src = url;
			}),
	);
}

/** No-op — browsers expose no per-URL cache eviction for <img>. */
export function evictImage(_src: string): Promise<boolean> {
	return Promise.resolve(false);
}

/** No-op — browsers expose no cache clearing for <img>. */
export function clearImageCaches(): Promise<void> {
	return Promise.resolve();
}

/** Always 'none' — the browser cache is not queryable. Returns the same
 *  `Record` shape as native, keyed by each requested URL. */
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
