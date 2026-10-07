import { isAndroid } from '@nativescript/core'
import { getImagePipeline, initialize } from '@nativescript-community/ui-image'
import type { PrefetchOptions } from './props'

/** prefetch — warm the image engine's disk cache for `srcs` without displaying
 *  anything. Android (Fresco): `prefetchToDiskCache` stores encoded bytes on
 *  disk and defers bitmap decode to display. iOS (SDWebImage): the prefetcher
 *  stores the downloaded image to the disk cache only. Either way a later
 *  `AnimatedImage` with the same src hits disk instead of the network.
 *  Resolves false when any URL fails; resolves false when the pipeline is not
 *  available yet (e.g. called before app launch). */
export function prefetch(srcs: string | string[], options?: PrefetchOptions): Promise<boolean> {
	const urls = Array.isArray(srcs) ? srcs : [srcs]
	if (urls.length === 0) {
		return Promise.resolve(true)
	}

	try {
		// The plugin lazily initializes Fresco inside createNativeView; a prefetch
		// that runs before any Img mounts has to do it first. initialize() is a
		// no-op once the plugin (or the app) has initialized. iOS has no equivalent
		// requirement and its initialize() is not guarded, so it stays Android-only.
		if (isAndroid) {
			initialize()
		}

		const pipeline = getImagePipeline()

		return Promise.all(
			urls.map((url) =>
				pipeline.prefetchToDiskCache(url, options).then(
					() => true,
					() => false,
				),
			),
		).then((results) => results.every(Boolean))
	} catch {
		return Promise.resolve(false)
	}
}
