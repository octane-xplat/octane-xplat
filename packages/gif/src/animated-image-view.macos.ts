/** AppKit animated-image surface. An NSView hosts an NSImageView, which owns
 *  GIF frame timing; this class owns fit geometry, visibility gating, source
 *  loading, and disposal. TypeScript port of the removed Swift
 *  XplatAnimatedImageView — identical contract, no app-shell scripts or mobile
 *  image plugin. */
import {
	interop,
	NativeClass,
	NSAccessibilityImageRole,
	NSBundle,
	NSData,
	NSImage,
	NSImageScaling,
	NSImageView,
	NSMutableData,
	NSObject,
	NSOperationQueue,
	NSURL,
	NSURLSession,
	NSURLSessionConfiguration,
	NSURLSessionDataDelegate,
	NSURLSessionDataTask,
	NSURLSessionTask,
	NSView,
	NSWorkspace,
	NSWorkspaceAccessibilityDisplayOptionsDidChangeNotification,
} from '@octane-xplat/platform/macos'
import type { NSError, NSHTTPURLResponse } from '@octane-xplat/platform/macos'
import type { AppKitAnimatedImageNative } from './animated-image-owner.macos.ts'

interface AnimatedImageState {
	imageView: NSImageView
	session: NSURLSession
	delegate: NSObject
	task: NSURLSessionDataTask | null
	revision: number
	disposed: boolean
	fit: string
	displayObserver: interop.Object | null
}

interface SessionLoad {
	task: NSURLSessionDataTask
	body: NSMutableData
	isFile: boolean
	install: (data: NSData | null) => void
}

const states = new WeakMap<object, AnimatedImageState>()
const loads = new WeakMap<object, SessionLoad | null>()

function requireState(view: object): AnimatedImageState {
	const state = states.get(view)
	if (!state) {
		throw new Error('Animated image view is missing its state')
	}
	return state
}

function updateAnimation(view: NSView): void {
	const state = states.get(view)
	if (!state) {
		return
	}
	state.imageView.animates =
		!state.disposed &&
		view.window != null &&
		!view.isHiddenOrHasHiddenAncestor() &&
		!NSWorkspace.sharedWorkspace.accessibilityDisplayShouldReduceMotion
}

/** The runtime only invokes JS blocks on the main queue — dispatch_async
 *  globals, custom NSOperationQueues and default-delegate NSURLSession
 *  completions never deliver. Remote-load completion blocks never deliver at
 *  all (runtime-verified: the task resumes but no callback arrives, and
 *  NSURLConnection's block API fails the same way). Delegate callbacks do
 *  dispatch, so the session uses this ObjC protocol delegate delivered on the
 *  main queue. The JSC host only registers enumerable prototype members as new
 *  ObjC methods, so the class enumerates before NativeClass. */
class AnimatedImageSessionDelegate extends NSObject implements NSURLSessionDataDelegate {
	static ObjCProtocols = [NSURLSessionDataDelegate]
	static {
		for (const name of Object.getOwnPropertyNames(this.prototype)) {
			if (name === 'constructor') {
				continue
			}
			const descriptor = Object.getOwnPropertyDescriptor(this.prototype, name)!
			Object.defineProperty(this.prototype, name, { ...descriptor, enumerable: true })
		}
		NativeClass(this)
	}

	URLSessionDataTaskDidReceiveData(
		_session: NSURLSession,
		dataTask: NSURLSessionDataTask,
		data: NSData,
	) {
		const load = loads.get(this)
		if (load?.task === dataTask) {
			load.body.appendData(data)
		}
	}

	URLSessionTaskDidCompleteWithError(
		_session: NSURLSession,
		task: NSURLSessionTask,
		error: NSError | null,
	) {
		const load = loads.get(this)
		if (!load || load.task !== (task as NSURLSessionDataTask)) {
			return
		}
		loads.set(this, null)
		// File tasks report no HTTP response; every other source requires a 2xx.
		const status = load.isFile
			? 200
			: Number((task.response as NSHTTPURLResponse | null)?.statusCode ?? 0)
		const payload = error == null && status >= 200 && status < 300 ? load.body : null
		// Redispatch install through a fresh main-queue operation, matching the
		// Swift wrapper's DispatchQueue.main.async boundary.
		NSOperationQueue.mainQueue.addOperationWithBlock(() => load.install(payload))
	}
}

const ALLOWED_SCHEMES = new Set(['http', 'https', 'file', 'data'])

/** Resolve a shared `src` to an NSURL with the same grammar the Swift wrapper
 *  accepted: `~/` bundle resource, absolute file path, or a parsed URL. */
function sourceURL(source: string): NSURL | null {
	if (source.startsWith('~/')) {
		const base = NSBundle.mainBundle.resourceURL
		return base ? base.URLByAppendingPathComponentIsDirectory(source.slice(2), false) : null
	}
	if (source.startsWith('/')) {
		return NSURL.fileURLWithPath(source)
	}
	return NSURL.URLWithString(source)
}

export class XplatAnimatedImageView extends NSView implements AppKitAnimatedImageNative {
	static {
		NativeClass(this)
	}

	static create(): XplatAnimatedImageView {
		const view = XplatAnimatedImageView.alloc().initWithFrame({
			origin: { x: 0, y: 0 },
			size: { width: 0, height: 0 },
		})
		view.wantsLayer = true
		view.layer.masksToBounds = true
		const imageView = NSImageView.alloc().initWithFrame({
			origin: { x: 0, y: 0 },
			size: { width: 0, height: 0 },
		})
		imageView.imageScaling = NSImageScaling.ImageScaleAxesIndependently
		imageView.editable = false
		imageView.allowsCutCopyPaste = false
		imageView.accessibilityElement = false
		view.addSubview(imageView)
		view.accessibilityRole = NSAccessibilityImageRole
		view.accessibilityElement = false
		const configuration = NSURLSessionConfiguration.ephemeralSessionConfiguration
		configuration.URLCache = null as unknown as NSURLSessionConfiguration['URLCache']
		configuration.URLCredentialStorage =
			null as unknown as NSURLSessionConfiguration['URLCredentialStorage']
		configuration.HTTPCookieStorage =
			null as unknown as NSURLSessionConfiguration['HTTPCookieStorage']
		configuration.HTTPShouldSetCookies = false
		const delegate = AnimatedImageSessionDelegate.new()
		const state: AnimatedImageState = {
			imageView,
			session: NSURLSession.sessionWithConfigurationDelegateDelegateQueue(
				configuration,
				delegate,
				NSOperationQueue.mainQueue,
			),
			delegate,
			task: null,
			revision: 0,
			disposed: false,
			fit: 'aspectFit',
			displayObserver: null,
		}
		states.set(view, state)
		const observed = new WeakRef(view)
		state.displayObserver =
			NSWorkspace.sharedWorkspace.notificationCenter.addObserverForNameObjectQueueUsingBlock(
				NSWorkspaceAccessibilityDisplayOptionsDidChangeNotification,
				null,
				NSOperationQueue.mainQueue,
				() => {
					const target = observed.deref()
					if (target) {
						updateAnimation(target)
					}
				},
			)
		return view
	}

	isFlipped(): boolean {
		return true
	}

	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	get intrinsicContentSize() {
		return states.get(this)?.imageView.image?.size ?? { width: 0, height: 0 }
	}

	hitTest(_point: { x: number; y: number }): NSView {
		return null as unknown as NSView
	}

	layout() {
		super.layout()
		const state = states.get(this)
		if (!state) {
			return
		}
		const { imageView } = state
		const bounds = this.bounds
		const image = imageView.image
		if (!image) {
			imageView.frame = {
				origin: { x: 0, y: 0 },
				size: { width: bounds.size.width, height: bounds.size.height },
			}
			return
		}
		const size = image.size
		if (!(size.width > 0 && size.height > 0 && bounds.size.width > 0 && bounds.size.height > 0)) {
			imageView.frame = {
				origin: { x: 0, y: 0 },
				size: { width: 0, height: 0 },
			}
			return
		}
		let target = { width: size.width, height: size.height }
		if (state.fit === 'fill') {
			target = { width: bounds.size.width, height: bounds.size.height }
		} else if (state.fit !== 'none') {
			const x = bounds.size.width / size.width
			const y = bounds.size.height / size.height
			const scale = state.fit === 'aspectFill' ? Math.max(x, y) : Math.min(x, y)
			target = { width: size.width * scale, height: size.height * scale }
		}
		imageView.frame = {
			origin: {
				x: bounds.origin.x + bounds.size.width / 2 - target.width / 2,
				y: bounds.origin.y + bounds.size.height / 2 - target.height / 2,
			},
			size: target,
		}
	}

	viewDidMoveToWindow() {
		super.viewDidMoveToWindow()
		updateAnimation(this)
	}

	viewDidHide() {
		super.viewDidHide()
		updateAnimation(this)
	}

	viewDidUnhide() {
		super.viewDidUnhide()
		updateAnimation(this)
	}

	setFit(value: string): void {
		requireState(this).fit = value
		this.needsLayout = true
	}

	setAlt(value: string): void {
		this.accessibilityLabel = value
		this.accessibilityElement = value.length > 0
	}

	setSource(source: string): void {
		const state = requireState(this)
		if (state.disposed) {
			return
		}
		state.revision += 1
		state.task?.cancel()
		state.task = null
		loads.set(state.delegate, null)
		state.imageView.animates = false
		state.imageView.image = null as unknown as NSImage
		this.invalidateIntrinsicContentSize()
		const own = state.revision
		const url = sourceURL(source)
		if (!url) {
			return
		}
		const scheme = String(url.scheme ?? '').toLowerCase()
		if (!ALLOWED_SCHEMES.has(scheme)) {
			return
		}
		if (!(url.isFileURL() || scheme === 'data' || String(url.host ?? '').length > 0)) {
			return
		}
		const self = new WeakRef(this)
		const install = (data: NSData | null) => {
			const view = self.deref()
			if (!view || state.disposed || state.revision !== own) {
				return
			}
			state.task = null
			state.imageView.image = (data ? NSImage.alloc().initWithData(data) : null) as NSImage
			view.invalidateIntrinsicContentSize()
			view.needsLayout = true
			updateAnimation(view)
		}
		if (scheme === 'data') {
			// URLSession cannot serve data: URLs. The read is in-process base64
			// decode, so run it inline and defer delivery to stay asynchronous —
			// callers rely on install never re-entering setSource synchronously.
			const data = NSData.dataWithContentsOfURL(url)
			try {
				NSOperationQueue.mainQueue.addOperationWithBlock(() => install(data))
			} catch {
				// Delivery failed; the surface stays empty, matching load failure.
			}
			return
		}
		const load: SessionLoad = {
			task: null as unknown as NSURLSessionDataTask,
			body: NSMutableData.new(),
			isFile: url.isFileURL(),
			install,
		}
		const task = state.session.dataTaskWithURL(url)
		load.task = task
		loads.set(state.delegate, load)
		state.task = task
		task.resume()
	}

	dispose(): void {
		const state = states.get(this)
		if (!state || state.disposed) {
			return
		}
		state.disposed = true
		state.revision += 1
		loads.set(state.delegate, null)
		state.session.invalidateAndCancel()
		state.task?.cancel()
		state.task = null
		state.imageView.animates = false
		state.imageView.image = null as unknown as NSImage
		this.invalidateIntrinsicContentSize()
		if (state.displayObserver) {
			NSWorkspace.sharedWorkspace.notificationCenter.removeObserver(state.displayObserver)
		}
		state.displayObserver = null
	}
}

export function createAnimatedImageView(): AppKitAnimatedImageNative {
	return XplatAnimatedImageView.create()
}
