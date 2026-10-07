import { ImagePipeline, getImagePipeline, initialize } from '@nativescript-community/ui-image';
import { prefetchBatch } from './prefetch-batch';
import type { ImageCacheConfig, ImageCacheQueryOptions, ImageCacheState, PrefetchOptions } from './props';

/** Apply engine-level cache configuration. Call from the app entry before the
 *  first <Image> renders — the plugin initializes Glide lazily, so sizing must
 *  arrive before the first view creates the engine. A later call is a no-op
 *  (the plugin guards on its own `initialized` flag). Native only. */
export function initializeImageCache(config?: ImageCacheConfig): void {
	initialize({
		memoryCacheSize: config?.memoryCacheSize,
		memoryCacheScreens: config?.memoryCacheScreens,
		usePersistentCacheKeyStore: config?.persistentCacheKeys,
		globalSignatureKey: config?.globalSignatureKey,
	});

	if (config?.iosComplexCacheEviction !== undefined) {
		ImagePipeline.iosComplexCacheEviction = config.iosComplexCacheEviction;
	}
}

/** Warm the disk cache without decoding — bytes are fetched and stored, decode
 *  cost stays at display time. One URL or an array; resolves `true` when all
 *  warmed, `false` if any URL fails or the pipeline is not up yet (e.g. called
 *  before app launch). Same contract as `@octane-xplat/gif`'s `prefetch`.
 *
 *  `options.headers` is forwarded on Android and iOS (via the framework
 *  patch). `options.concurrency` caps parallel fetches. */
export function prefetch(srcs: string | string[], options?: PrefetchOptions): Promise<boolean> {
	try {
		initialize();
		const pipeline = getImagePipeline();
		const { concurrency, ...engineOptions } = options ?? {};
		return prefetchBatch(srcs, concurrency, (url) =>
			pipeline.prefetchToDiskCache(url, engineOptions).then(
				() => true,
				() => false,
			),
		);
	} catch {
		return Promise.resolve(false);
	}
}

/** Remove `src` from memory and disk caches. */
export function evictImage(src: string): Promise<boolean> {
	initialize();
	return getImagePipeline().evictFromCache(src);
}

/** Drop every cached image (memory + disk). */
export function clearImageCaches(): Promise<void> {
	initialize();
	return getImagePipeline().clearCaches();
}

// The published index.d.ts omits the options params on the two presence
// probes — the iOS implementation folds them into the cache key through
// getContextFromOptions (the same context the Img display path builds), and
// Android ignores the extra arg since its probe keys on the URL alone.
// Declared locally so the probe can pass the display load's decode context.
interface CacheProbe {
	isInBitmapMemoryCache(uri: string, options?: ImageCacheQueryOptions): boolean;
	isInDiskCache(uri: string, options?: ImageCacheQueryOptions): Promise<boolean>;
}

/** Report which cache level currently holds each `src` — 'memory', 'disk',
 *  or 'none' (not cached / unknown). Accepts a single URL or a list; the
 *  result is always a `Record` keyed by URL (the RN `queryCache` shape).
 *  `options` repeats the display load's decode bounds: on iOS the cache key
 *  includes the transform context, so an image displayed with
 *  decodeWidth/decodeHeight only reports its level when the probe passes
 *  the same values. Android caveat: the plugin's probe cannot see Glide's
 *  active resources, so a bitmap still on screen may report 'none' —
 *  treat 'none' as "not provably cached", not "absent". */
export async function isImageCached(
	srcs: string | readonly string[],
	options?: ImageCacheQueryOptions,
): Promise<Record<string, ImageCacheState>> {
	initialize();
	const pipeline = getImagePipeline() as unknown as CacheProbe;
	const list = typeof srcs === 'string' ? [srcs] : srcs;
	const states: Record<string, ImageCacheState> = {};
	await Promise.all(
		list.map(async (src) => {
			states[src] = pipeline.isInBitmapMemoryCache(src, options)
				? 'memory'
				: ((await pipeline.isInDiskCache(src, options)) ? 'disk' : 'none');
		}),
	);

	return states;
}
