import { prefetchBatch } from './prefetch-batch'
import type {
	ImageCacheConfig,
	ImageCacheQueryOptions,
	ImageCacheState,
	PrefetchOptions,
} from './props'

declare const NSURL: { URLWithString(url: string): any }
declare const NSURLRequest: { requestWithURL(url: any): any }
declare const NSURLSession: {
	sharedSession: {
		dataTaskWithRequestCompletionHandler(
			request: any,
			handler: (data: any, response: any, error: any) => void,
		): { resume(): void }
	}
}
declare const NSMutableURLRequest: {
	requestWithURL(url: any): { setValueForHTTPHeaderField(value: string, field: string): void }
}
declare const NSCachedURLResponse: {
	alloc(): { initWithResponseData(response: any, data: any): any }
}
declare const NSURLCache: {
	sharedURLCache: {
		memoryCapacity: number
		cachedResponseForRequest(request: any): { data?: any } | null
		storeCachedResponseForRequest(cached: any, request: any): void
		removeCachedResponseForRequest(request: any): void
		removeAllCachedResponses(): void
	}
}
declare const NSFileManager: { defaultManager: { fileExistsAtPath(path: string): boolean } }
declare const NSBundle: { mainBundle: { resourcePath: string } }
declare const NSImage: { imageNamed(name: string): unknown }

const sharedCache = () => NSURLCache.sharedURLCache

/** Apply engine-level cache configuration — the AppKit host's image engine
 *  is the shared NSURLCache, so `memoryCacheSize` maps to its
 *  `memoryCapacity`. The remaining knobs are engine-specific (Glide/SDWebImage)
 *  and ignored here, same as the web leaf. Call before the first fetch. */
export function initializeImageCache(config?: ImageCacheConfig): void {
	if (config?.memoryCacheSize !== undefined) {
		sharedCache().memoryCapacity = config.memoryCacheSize
	}
}

/** prefetch — warm the shared URL cache so a later `Image` with the same src
 *  decodes without a network fetch (the AppKit host's image leaf consults
 *  NSURLCache before opening a session task). Responses are stored
 *  explicitly, so the warm does not depend on server cache headers.
 *  `options.headers` is honored through NSMutableURLRequest. Local sources
 *  resolve true when the file/resource exists — nothing needs warming; a
 *  missing file resolves false. Resolves false when any URL fails. */
export function prefetch(srcs: string | string[], options?: PrefetchOptions): Promise<boolean> {
	return prefetchBatch(srcs, options?.concurrency, (url) => {
		if (/^https?:\/\//i.test(url)) {
			return warmRemote(url, options?.headers)
		}

		return Promise.resolve(warmLocal(url))
	})
}

/** Remove `src`'s entry from the shared URL cache. Resolves false for
 *  non-remote sources — local files are not held in the URL cache. */
export function evictImage(src: string): Promise<boolean> {
	if (!/^https?:\/\//i.test(src)) {
		return Promise.resolve(false)
	}

	try {
		sharedCache().removeCachedResponseForRequest(
			NSURLRequest.requestWithURL(NSURL.URLWithString(src)),
		)
		return Promise.resolve(true)
	} catch {
		return Promise.resolve(false)
	}
}

/** Drop every cached response in the shared URL cache — wider than the
 *  image engine's scope (all session traffic shares it), same honesty as a
 *  disk-cache clear. */
export function clearImageCaches(): Promise<void> {
	try {
		sharedCache().removeAllCachedResponses()
	} catch {
		// A cache that refuses the clear reports nothing; resolve like the
		// native degradation contract.
	}

	return Promise.resolve()
}

/** Report 'disk' when the shared URL cache holds a response for each `src`,
 *  'none' otherwise. 'memory' is never reported: the URL cache's memory tier
 *  is not separately queryable, and the renderer's decoded-image cache is
 *  host-internal — treat 'none' as "not provably cached" like the Android
 *  probe's caveat. `options` decode bounds do not apply here — URL cache
 *  keys are the request, not the transform. */
export async function isImageCached(
	srcs: string | readonly string[],
	_options?: ImageCacheQueryOptions,
): Promise<Record<string, ImageCacheState>> {
	const list = typeof srcs === 'string' ? [srcs] : srcs
	const states: Record<string, ImageCacheState> = {}
	for (const src of list) {
		let cached = false
		if (/^https?:\/\//i.test(src)) {
			try {
				cached =
					sharedCache().cachedResponseForRequest(
						NSURLRequest.requestWithURL(NSURL.URLWithString(src)),
					) != null
			} catch {
				cached = false
			}
		}

		states[src] = cached ? 'disk' : 'none'
	}

	return states
}

function warmRemote(src: string, headers?: Record<string, string>): Promise<boolean> {
	try {
		const request = NSMutableURLRequest.requestWithURL(NSURL.URLWithString(src))
		for (const [field, value] of Object.entries(headers ?? {})) {
			request.setValueForHTTPHeaderField(value, field)
		}

		return new Promise<boolean>((resolve) => {
			NSURLSession.sharedSession.dataTaskWithRequestCompletionHandler(
				request,
				(data: any, response: any, error: any) => {
					const status = Number(response?.statusCode ?? 0)
					if (error || !data || (status !== 0 && (status < 200 || status > 299))) {
						resolve(false)
						return
					}

					try {
						sharedCache().storeCachedResponseForRequest(
							NSCachedURLResponse.alloc().initWithResponseData(response, data),
							request,
						)
					} catch {
						// The fetch still completed; a cache that refuses the entry
						// degrades to a re-fetch at display, not a failed warm.
					}

					resolve(true)
				},
			).resume()
		})
	} catch {
		return Promise.resolve(false)
	}
}

function warmLocal(src: string): boolean {
	try {
		if (src.startsWith('~/')) {
			return NSFileManager.defaultManager.fileExistsAtPath(
				NSBundle.mainBundle.resourcePath + '/' + src.slice(2),
			)
		}

		if (src.startsWith('res://')) {
			return NSImage.imageNamed(src.slice(6)) != null
		}

		if (src.startsWith('file://')) {
			return NSFileManager.defaultManager.fileExistsAtPath(
				decodeURIComponent(src.slice('file://'.length)),
			)
		}

		if (src && !/^[a-z][a-z\d+.-]*:/i.test(src)) {
			return NSFileManager.defaultManager.fileExistsAtPath(src)
		}

		// data: URIs and empty sources carry no fetch — nothing to warm.
		return true
	} catch {
		return false
	}
}
