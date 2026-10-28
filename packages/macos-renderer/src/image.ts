/** Local and embedded sources avoid synchronous network work on AppKit's main thread. */

import {
	NSBundle,
	NSData,
	NSImage,
	NSImageView,
	NSOperationQueue,
	NSURL,
	NSURLCache,
	NSURLRequest,
	NSURLSession,
} from '@octane-xplat/platform/macos'
import { createImageRequests } from './image-requests.ts'

export function loadImage(source: unknown): NSImage | null {
	const src = String(source ?? '')
	const match = /^data:[^,]*;base64,(.+)$/s.exec(src)
	if (match) {
		const data = NSData.alloc().initWithBase64EncodedStringOptions(match[1], 0)
		return data ? NSImage.alloc().initWithData(data) : null
	}

	if (src.startsWith('res://')) {
		return NSImage.imageNamed(src.slice(6))
	}

	if (src.startsWith('~/')) {
		return NSImage.alloc().initWithContentsOfFile(
			NSBundle.mainBundle.resourcePath + '/' + src.slice(2),
		)
	}

	if (src.startsWith('file://')) {
		return NSImage.alloc().initWithContentsOfURL(NSURL.URLWithString(src))
	}

	if (src && !/^[a-z][a-z\d+.-]*:/i.test(src)) {
		return NSImage.alloc().initWithContentsOfFile(src)
	}

	if (src) {
		console.warn('[macos-image] Unsupported source; use a base64 data URI or local file')
	}

	return null
}

/** Per-view load state. The generation invalidates in-flight decodes when the
 *  source changes or `disposeImage` runs — the same guard the webview leaf
 *  applies to async measurements. `placeholderImage` is kept so a failed load
 *  can leave the placeholder standing (the native contract — the placeholder
 *  doubles as the failure image). */
interface ImageRequest {
	source: string
	placeholder: string
	placeholderImage: NSImage | null
	generation: number
	release?: () => void
}

const requests = new WeakMap<object, ImageRequest>()

/** The renderer and every mounted image share one bounded decode cache.
 * A final subscriber's removal cancels pending work instead of retaining its
 * view until a remote request eventually finishes. */
const imageRequests = createImageRequests<NSImage>((source, complete) => {
	if (!/^https?:\/\//i.test(source)) {
		const timer = setTimeout(() => {
			let image: NSImage | null = null
			try { image = loadImage(source) } catch (error) {
				console.error('[macos-image] decode failed', error)
			}
			complete(image)
		}, 0)
		return () => clearTimeout(timer)
	}

	// Preserve main's public prefetch/shared URL-cache path with cancellable delivery.
	let staged: NSData | null = null
	try {
		const request = NSURLRequest.requestWithURL(NSURL.URLWithString(source))
		staged = (NSURLCache.sharedURLCache.cachedResponseForRequest(request)?.data ?? null) as NSData | null
	} catch { staged = null }
	if (staged) {
		const timer = setTimeout(() => {
			let image: NSImage | null = null
			try { image = NSImage.alloc().initWithData(staged) } catch (error) {
				console.error('[macos-image] cached decode failed', error)
			}
			complete(image)
		}, 0)
		return () => clearTimeout(timer)
	}

	const mainQueue = NSOperationQueue.mainQueue
	if (typeof mainQueue?.addOperationWithBlock !== 'function') { complete(null); return }
	const url = NSURL.URLWithString(source)
	if (!url) { complete(null); return }
	let active = true
	const task = NSURLSession.sharedSession.dataTaskWithURLCompletionHandler(
		url,
		(data: any, response: any, error: any) => {
			if (!active) return
			// NSURLSession completion queues are not UI queues. Decode and
			// view delivery enter AppKit's main queue explicitly.
			mainQueue.addOperationWithBlock(() => {
				if (!active) return
				let image: NSImage | null = null
				const status = Number(response?.statusCode ?? 0)
				if (data && !error && status >= 200 && status < 300) {
					try { image = NSImage.alloc().initWithData(data) } catch (decodeError) {
						console.error('[macos-image] remote decode failed', decodeError)
					}
				}
				complete(image)
			})
		},
	)
	try { task.resume() } catch (error) { active = false; task.cancel(); throw error }
	return () => { active = false; task.cancel() }
})

/** Points `view` at `source`. Cached decodes assign immediately; anything else
 *  decodes on a later run-loop turn — or fetches over NSURLSession for
 *  http(s) — so command batches never block on image I/O. While a load is
 *  pending, `placeholder` (a loadImage-resolvable source; the leaf resolves
 *  thumbhash:/blurhash: to data: PNGs) paints into the same view, and a failed
 *  load leaves it standing. The previous image stays visible until its
 *  replacement resolves. */
export function updateImage(view: NSImageView, source: unknown, placeholder?: unknown) {
	const src = String(source ?? '')
	const ph = String(placeholder ?? '')
	let request = requests.get(view)
	if (!request) {
		request = { source: '', placeholder: '', placeholderImage: null, generation: 0 }
		requests.set(view, request)
	}

	if (request.source === src && request.placeholder === ph) {
		return
	}

	if (request.placeholder !== ph) {
		request.placeholderImage = null
	}

	request.source = src
	request.placeholder = ph
	const generation = ++request.generation
	request.release?.()
	request.release = undefined
	const deliver = (image: NSImage | null) => {
		if (requests.get(view) !== request || request.generation !== generation) {
			return
		}

		view.image = (image ?? request.placeholderImage) as NSImage
	}

	const showPlaceholder = () => {
		if (!ph) {
			return
		}

		if (!request.placeholderImage) {
			try {
				request.placeholderImage = loadImage(ph)
			} catch (error) {
				console.error('[macos-image] placeholder decode failed', error)
			}
		}

		if (request.placeholderImage) {
			view.image = request.placeholderImage as NSImage
		}
	}

	if (!src) {
		showPlaceholder()
		deliver(null)
		return
	}

	// Cached requests deliver synchronously; otherwise the placeholder stands
	// until a decode/fetch resolves. The previous image can remain meanwhile.
	request.release = imageRequests.subscribe(src, deliver, showPlaceholder)
}

/** Invalidates any in-flight decode for `view`; call when its node is destroyed. */
export function disposeImage(view: NSImageView) {
	const request = requests.get(view)
	requests.delete(view)
	request?.release?.()
}
