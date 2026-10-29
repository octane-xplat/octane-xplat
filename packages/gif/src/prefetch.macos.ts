import { prefetchBatch } from './prefetch-batch'
import type { PrefetchOptions } from './props'

declare const NSURL: { URLWithString(url: string): any }
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
	sharedURLCache: { storeCachedResponseForRequest(cached: any, request: any): void }
}
declare const NSFileManager: { defaultManager: { fileExistsAtPath(path: string): boolean } }
declare const NSBundle: { mainBundle: { resourcePath: string } }
declare const NSImage: { imageNamed(name: string): unknown }

/** prefetch — warm the shared URL cache so a later `AnimatedImage` with the
 *  same src decodes without a network fetch (the AppKit host's image leaf
 *  consults NSURLCache before opening a session task — the same hand-off
 *  SDWebImage/Fresco give the native leaves). Responses are stored
 *  explicitly, so the warm does not depend on server cache headers.
 *  `options.headers` is honored through NSMutableURLRequest — the AppKit
 *  host's fetches can carry them (iOS drops them in the plugin's prefetch
 *  path; see PrefetchOptions). Local sources resolve true — a res:// probe
 *  or a file that exists needs no warm; a missing file resolves false.
 *  Resolves false when any URL fails. */
export function prefetch(srcs: string | string[], options?: PrefetchOptions): Promise<boolean> {
	return prefetchBatch(srcs, options?.concurrency, (url) => {
		if (/^https?:\/\//i.test(url)) {
			return warmRemote(url, options?.headers)
		}

		return Promise.resolve(warmLocal(url))
	})
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
						NSURLCache.sharedURLCache.storeCachedResponseForRequest(
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
