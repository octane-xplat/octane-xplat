/** Local and embedded sources avoid synchronous network work on AppKit's main thread. */

import {
	NSBundle,
	NSData,
	NSImage,
	NSImageView,
	NSURL,
	NSURLSession,
} from '@octane-xplat/platform/macos'

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
}

const requests = new WeakMap<object, ImageRequest>()

/** Decoded images shared across views; bounded so galleries cannot retain
 *  every source they have ever shown. Failures are not cached — a file that
 *  appears later or a retry must still decode. */
const cache = new Map<string, NSImage>()
const pending = new Map<string, ((image: NSImage | null) => void)[]>()
const IMAGE_CACHE_LIMIT = 64

function settleImage(source: string, image: NSImage | null) {
	const callbacks = pending.get(source) ?? []
	pending.delete(source)

	if (image) {
		cache.delete(source)
		cache.set(source, image)
		while (cache.size > IMAGE_CACHE_LIMIT) {
			cache.delete(cache.keys().next().value!)
		}
	}

	for (const callback of callbacks) {
		callback(image)
	}
}

function decodeImage(source: string) {
	let image: NSImage | null = null
	try {
		image = loadImage(source)
	} catch (error) {
		console.error('[macos-image] decode failed', error)
	}

	settleImage(source, image)
}

/** Remote sources fetch through NSURLSession and settle through the same
 *  cache/waiter path as local decodes. The task is keyed by source, not view —
 *  a superseded request is generation-guarded, and letting the fetch finish
 *  still populates the cache for the next view asking for it. */
function fetchImage(source: string) {
	NSURLSession.sharedSession
		.dataTaskWithURLCompletionHandler(
			NSURL.URLWithString(source),
			(data: any, _response: any, error: any) => {
				let image: NSImage | null = null
				if (data && !error) {
					try {
						image = NSImage.alloc().initWithData(data)
					} catch (decodeError) {
						console.error('[macos-image] remote decode failed', decodeError)
					}
				}

				settleImage(source, image)
			},
		)
		.resume()
}

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

	const cached = cache.get(src)
	if (cached) {
		deliver(cached)
		return
	}

	// A decode/fetch is pending — the placeholder is the interim content.
	showPlaceholder()

	let waiters = pending.get(src)
	if (!waiters) {
		waiters = []
		pending.set(src, waiters)
		if (/^https?:\/\//i.test(src)) {
			fetchImage(src)
		} else {
			setTimeout(() => decodeImage(src), 0)
		}
	}

	waiters.push(deliver)
}

/** Invalidates any in-flight decode for `view`; call when its node is destroyed. */
export function disposeImage(view: NSImageView) {
	requests.delete(view)
}
