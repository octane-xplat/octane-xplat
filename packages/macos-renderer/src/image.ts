/** Local and embedded sources avoid synchronous network work on AppKit's main thread. */
export function loadImage(source: unknown): NSImage | null {
	const src = String(source ?? '')
	const match = /^data:[^,]*;base64,(.+)$/s.exec(src)
	if (match) {
		const data = NSData.alloc().initWithBase64EncodedStringOptions(match[1], 0)
		return data ? NSImage.alloc().initWithData(data) : null
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
 *  applies to async measurements. */
interface ImageRequest {
	source: string
	generation: number
}

const requests = new WeakMap<object, ImageRequest>()

/** Decoded images shared across views; bounded so galleries cannot retain
 *  every source they have ever shown. Failures are not cached — a file that
 *  appears later or a retry must still decode. */
const cache = new Map<string, NSImage>()
const pending = new Map<string, ((image: NSImage | null) => void)[]>()
const IMAGE_CACHE_LIMIT = 64

function decodeImage(source: string) {
	const callbacks = pending.get(source) ?? []
	pending.delete(source)

	let image: NSImage | null = null
	try {
		image = loadImage(source)
	} catch (error) {
		console.error('[macos-image] decode failed', error)
	}

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

/** Points `view` at `source`. Cached decodes assign immediately; anything else
 *  decodes on a later run-loop turn so command batches never block on image
 *  I/O. The previous image stays visible until its replacement resolves. */
export function updateImage(view: NSImageView, source: unknown) {
	const src = String(source ?? '')
	let request = requests.get(view)
	if (!request) {
		request = { source: '', generation: 0 }
		requests.set(view, request)
	}

	if (request.source === src) {
		return
	}

	request.source = src
	const generation = ++request.generation
	const deliver = (image: NSImage | null) => {
		if (requests.get(view) !== request || request.generation !== generation) {
			return
		}

		view.image = image
	}

	if (!src) {
		deliver(null)
		return
	}

	const cached = cache.get(src)
	if (cached) {
		deliver(cached)
		return
	}

	let waiters = pending.get(src)
	if (!waiters) {
		waiters = []
		pending.set(src, waiters)
		setTimeout(() => decodeImage(src), 0)
	}

	waiters.push(deliver)
}

/** Invalidates any in-flight decode for `view`; call when its node is destroyed. */
export function disposeImage(view: NSImageView) {
	requests.delete(view)
}
