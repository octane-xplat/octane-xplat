/** Local and embedded sources avoid synchronous network work on AppKit's main thread. */

import {
	NSBundle,
	NSData,
	NSImage,
	NSImageView,
	NSOperationQueue,
	NSURL,
	NSURLSession,
	NSURLSessionConfiguration,
	NSURLCache,
	NSURLRequest,
	NSCachedURLResponse,
	NSFileManager,
} from '@octane-xplat/platform/macos'
import { createImageRequests } from './image-requests.ts'
import { createImageByteCache } from './image-byte-cache.ts'
import { imagePixelSize } from './image-pixels.ts'

const imageBytes = createImageByteCache(() => ({ NSBundle, NSFileManager, NSURL, NSURLCache, NSURLRequest, NSCachedURLResponse, NSURLSessionConfiguration, NSURLSession, NSOperationQueue }))

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
	policy: 'memory-disk' | 'none'
	phase: 'empty' | 'pending' | 'success' | 'failure'
	notified: boolean
	notification?: ReturnType<typeof setTimeout>
	release?: () => void
}

const requests = new WeakMap<object, ImageRequest>()
export interface AppKitImageLoadEvent { width: number; height: number; source: 'memory' | 'disk' | 'network' | 'local' }
interface ImageEventHandlers { onLoad?(event: AppKitImageLoadEvent, current: () => boolean): void; onError?(event: { error: Error }, current: () => boolean): void }
const eventHandlers = new WeakMap<object, ImageEventHandlers>()
export function setImageEventHandlers(view: NSImageView, handlers?: ImageEventHandlers): void {
	if (handlers?.onLoad || handlers?.onError) eventHandlers.set(view, handlers)
	else eventHandlers.delete(view)
}
function clearImageNotification(request: ImageRequest) {
	if (request.notification !== undefined) clearTimeout(request.notification)
	request.notification = undefined
}
function notifyImageResult(view: NSImageView, request: ImageRequest, current: () => boolean, result: { load(): AppKitImageLoadEvent } | { error(): { error: Error } }) {
	if (!current() || request.notified) return
	clearImageNotification(request)
	request.notification = setTimeout(() => {
		request.notification = undefined
		if (!current() || request.notified) return
		request.notified = true // Claim before metadata or consumer reentry, even without a handler.
		try {
			if ('load' in result) {
				if (!eventHandlers.get(view)?.onLoad) return
				const event = result.load()
				if (current()) eventHandlers.get(view)?.onLoad?.(event, current)
			} else {
				if (!eventHandlers.get(view)?.onError) return
				const event = result.error()
				if (current()) eventHandlers.get(view)?.onError?.(event, current)
			}
		} catch (error) { console.error('[macos-image] result handler failed', error) }
	}, 0)
}
interface LoadedImage { image: NSImage; source: 'network' | 'disk' | 'local' }

/** Default loads share bounded decoded requests; bypass has a separate,
 * non-retaining pool below. The final subscriber owns cancellation. */
function startImage(source: string, complete: (image: LoadedImage | null) => void, policy: 'memory-disk' | 'none') {
	if (!/^https?:\/\//i.test(source)) {
		const timer = setTimeout(() => {
			let image: NSImage | null = null
			try { image = loadImage(source) } catch (error) {
				console.error('[macos-image] decode failed', error)
			}
			complete(image ? { image, source: 'local' } : null)
		}, 0)
		return () => clearTimeout(timer)
	}

	return imageBytes.subscribe(source, (result) => {
		let image: NSImage | null = null
		if (result) {
			try { image = NSImage.alloc().initWithData(result.data) } catch (error) { console.error('[macos-image] remote decode failed', error) }
		}
		complete(image && result ? { image, source: result.source } : null)
	}, policy)
}
const imageRequests = createImageRequests<LoadedImage>((source, complete) => startImage(source, complete, 'memory-disk'))
const bypassImageRequests = createImageRequests<LoadedImage>((source, complete) => startImage(source, complete, 'none'), 0)

/** Private decoded-memory controls. Deliberately separate from the image leaf's
 * public memory+disk cache contract and NSURLSession's HTTP caching. Invalidating
 * never blanks mounted views or cancels their remaining subscribed deliveries. */
export const imageMemoryCache = {
	isCached: imageRequests.isCached,
	evict: imageRequests.evict,
	clear: imageRequests.clear,
}

/** Image-owned public-cache backend. Encoded disk bytes and decoded memory
 * invalidate together; mounted views retain their subscribed deliveries. */
export const imageCache = {
	supportsCachePolicy: true,
	supportsLoadEvents: true,
	initialize: imageBytes.initialize,
	prefetch: imageBytes.prefetch,
	isCached(source: string): 'memory' | 'disk' | 'none' {
		return imageMemoryCache.isCached(source) ? 'memory' : imageBytes.isCached(source) ? 'disk' : 'none'
	},
	evict(source: string): boolean { imageMemoryCache.evict(source); return imageBytes.evict(source) },
	clear(): boolean { imageMemoryCache.clear(); return imageBytes.clear() },
}

/** Points `view` at `source`. Cached decodes assign immediately; anything else
 *  decodes on a later run-loop turn — or fetches over NSURLSession for
 *  http(s). Implicit disk setup/read and remote decode are deferred; local
 *  placeholder loading remains synchronous. While a load is
 *  pending, `placeholder` (a loadImage-resolvable source; the leaf resolves
 *  thumbhash:/blurhash: to data: PNGs) paints into the same view, and a failed
 *  load leaves it standing. The previous image stays visible until its
 *  replacement resolves. */
export function updateImage(view: NSImageView, source: unknown, placeholder?: unknown, policy: 'memory-disk' | 'none' | null = 'memory-disk') {
	const effectivePolicy = policy ?? 'memory-disk'
	if (effectivePolicy !== 'memory-disk' && effectivePolicy !== 'none') throw new TypeError('Invalid AppKit image cache policy')
	const src = String(source ?? ''), ph = String(placeholder ?? '')
	let request = requests.get(view)
	if (!request) {
		request = { source: '', placeholder: '', placeholderImage: null, generation: 0, policy: effectivePolicy, phase: 'empty', notified: false }
		requests.set(view, request)
	}
	const sourceChanged = request.source !== src || request.policy !== effectivePolicy
	if (!sourceChanged && request.placeholder === ph) return
	const previousPlaceholder = request.placeholderImage
	if (request.placeholder !== ph) request.placeholderImage = null
	request.placeholder = ph
	if (sourceChanged) {
		request.source = src; request.policy = effectivePolicy; request.generation++
		request.phase = src ? 'pending' : 'empty'; request.notified = false
		clearImageNotification(request)
	}
	const generation = request.generation
	const current = () => requests.get(view) === request && request.generation === generation
	if (sourceChanged) {
		const previousRelease = request.release; request.release = undefined
		previousRelease?.()
		if (!current()) return
	}
	const showPlaceholder = () => {
		const ownsPlaceholder = () => current() && request.placeholder === ph
		if (!ownsPlaceholder()) return
		if (ph && !request.placeholderImage) {
			try {
				const image = loadImage(ph)
				if (!ownsPlaceholder()) return
				request.placeholderImage = image
			} catch (error) { console.error('[macos-image] placeholder decode failed', error) }
		}
		if (!ownsPlaceholder()) return
		if (request.placeholderImage || request.phase === 'empty' || request.phase === 'failure' || (previousPlaceholder && view.image === previousPlaceholder)) {
			if (ownsPlaceholder()) {
				try { view.image = request.placeholderImage as NSImage }
				catch (error) { console.error('[macos-image] placeholder assignment failed', error) }
			}
		}
	}
	// A placeholder update paints current loading/failure chrome, not another
	// source request or terminal notification. It must not cover a loaded image.
	if (!sourceChanged) { if (request.phase !== 'success') showPlaceholder(); return }
	if (!src) { showPlaceholder(); return }
	let memoryHit = true
	const deliver = (loaded: LoadedImage | null) => {
		if (!current()) return
		request.phase = loaded ? 'success' : 'failure'
		try { view.image = (loaded?.image ?? request.placeholderImage) as NSImage }
		catch {
			if (current()) { request.phase = 'failure'; notifyImageResult(view, request, current, { error: () => ({ error: new Error('AppKit image display failed') }) }) }
			return
		}
		if (!current()) return
		if (loaded) notifyImageResult(view, request, current, { load: () => ({ ...imagePixelSize(loaded.image), source: memoryHit ? 'memory' : loaded.source }) })
		else notifyImageResult(view, request, current, { error: () => ({ error: new Error('AppKit image load or decode failed') }) })
	}
	const release = (effectivePolicy === 'none' ? bypassImageRequests : imageRequests).subscribe(src, deliver, () => { memoryHit = false; showPlaceholder() })
	if (current()) request.release = release
	else release()
}

/** Shared decoded-image request for non-view consumers (background url()
 *  layers). Delivers the NSImage or null; the release cancels. */
export function requestImage(source: string, deliver: (image: NSImage | null) => void): () => void {
	return imageRequests.subscribe(source, (loaded) => deliver(loaded?.image ?? null))
}

/** Invalidates any in-flight decode for `view`; call when its node is destroyed. */
export function disposeImage(view: NSImageView) {
	const request = requests.get(view)
	requests.delete(view)
	eventHandlers.delete(view)
	if (request) clearImageNotification(request)
	request?.release?.()
}
