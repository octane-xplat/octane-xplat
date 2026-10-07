import { ImagePipeline, getImagePipeline, initialize } from '@nativescript-community/ui-image';
import { prefetchBatch } from './prefetch-batch';
import type { ImageCacheConfig, ImageCacheState, PrefetchOptions } from './props';

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
 *  `options.headers` is forwarded to the engine — honored on Android, dropped
 *  on iOS until the plugin's prefetch path learns the request-modifier branch
 *  (see PrefetchOptions). `options.concurrency` caps parallel fetches. */
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

/** Report which cache level currently holds `src` — 'memory', 'disk', or
 *  'none' (not cached / unknown). */
export async function isImageCached(src: string): Promise<ImageCacheState> {
	initialize();
	const pipeline = getImagePipeline();
	if (pipeline.isInBitmapMemoryCache(src)) {
		return 'memory';
	}

	return (await pipeline.isInDiskCache(src)) ? 'disk' : 'none';
}
