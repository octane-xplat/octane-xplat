import { UnavailabilityError } from '@octane-xplat/lib/capability'
import { MAX_CAPTURE_PIXELS } from './options'
import type { CaptureBackend } from './backend-types'
import type { NormalizedCaptureOptions } from './types'

// Foundation symbols arrive as ObjC bridge globals on every Apple host: the
// NativeScript iOS runtime and the macOS node-api runtime both register
// NSThread/NSClassFromString/NSFileManager/NSUUID once their frameworks load.
// Local declarations keep this shared leaf compilable under both type worlds.
declare const NSThread: { readonly isMainThread: boolean }
declare const NSClassFromString: (name: string) => unknown
declare const NSUUID: { UUID(): { UUIDString: string } }
declare const NSFileManager: {
	defaultManager: {
		readonly temporaryDirectory: NativeURL
		fileExistsAtPath(path: string): boolean
		removeItemAtURLError(url: NativeURL): boolean
	}
}
interface NativeURL {
	readonly absoluteString: string
	readonly path: string
	URLByAppendingPathComponent(component: string): NativeURL
}
interface NativeArray<T> {
	readonly count: number
	objectAtIndex(index: number): T
}
export interface NativeLayer {
	readonly sublayers: NativeArray<NativeLayer> | null
	isKindOfClass(type: unknown): boolean
}
export interface NativeView {
	readonly window: object | null
	readonly bounds: {
		origin: { x: number; y: number }
		size: { width: number; height: number }
	}
	readonly subviews: NativeArray<NativeView>
	readonly layer: NativeLayer | null
	isKindOfClass(type: unknown): boolean
}
export interface NativeData {
	base64EncodedStringWithOptions(options: number): string
	writeToURLAtomically(url: unknown, atomically: boolean): boolean
}

export function createAppleBackend(policy: {
	resolve(target: object): NativeView
	screen?(): NativeView
	renderInContext: boolean
	available(): boolean
	attached?(view: NativeView): boolean
	protectedView: readonly string[]
	protectedLayer: readonly string[]
	scale(view: NativeView): number
	checkSourceDimensions: boolean
	render(
		view: NativeView,
		width: number,
		height: number,
		options: NormalizedCaptureOptions,
	): NativeData
}): CaptureBackend {
	const owned = new Map<string, NativeURL>()
	function required() {
		if (!policy.available()) {
			throw new UnavailabilityError('Native view capture on this host')
		}
	}
	function protectedLayer(layer: NativeLayer | null): boolean {
		if (!layer) {
			return false
		}
		for (const name of policy.protectedLayer) {
			const type = NSClassFromString(name)
			if (type && layer.isKindOfClass(type)) {
				return true
			}
		}
		const sublayers = layer.sublayers
		if (!sublayers) {
			return false
		}
		for (let i = 0; i < sublayers.count; i++) {
			if (protectedLayer(sublayers.objectAtIndex(i))) {
				return true
			}
		}
		return false
	}
	function protectedSurface(view: NativeView): boolean {
		for (const name of policy.protectedView) {
			const type = NSClassFromString(name)
			if (type && view.isKindOfClass(type)) {
				return true
			}
		}
		if (protectedLayer(view.layer)) {
			return true
		}
		for (let i = 0; i < view.subviews.count; i++) {
			if (protectedSurface(view.subviews.objectAtIndex(i))) {
				return true
			}
		}
		return false
	}
	function check(view: NativeView): void {
		if (!NSThread.isMainThread) {
			throw new Error('View capture requires the main thread')
		}
		if (policy.attached ? !policy.attached(view) : !view.window) {
			throw new Error('View is detached')
		}
		const { width, height } = view.bounds.size
		if (
			!Number.isFinite(width) ||
			!Number.isFinite(height) ||
			width <= 0 ||
			height <= 0
		) {
			throw new Error('View has no laid-out area')
		}
		if (protectedSurface(view)) {
			throw new Error('Web/video/GPU surfaces are outside this capture subset')
		}
	}
	function validate(target: object): NativeView {
		required()
		const view = policy.resolve(target)
		check(view)
		return view
	}
	function withinLimits(width: number, height: number): boolean {
		return (
			Number.isFinite(width) &&
			Number.isFinite(height) &&
			width === Math.round(width) &&
			height === Math.round(height) &&
			width > 0 &&
			height > 0 &&
			width <= 16384 &&
			height <= 16384 &&
			width * height <= MAX_CAPTURE_PIXELS
		)
	}
	async function capture(target: object, options: NormalizedCaptureOptions): Promise<string> {
		if (
			options.format === 'webp' ||
			options.snapshotContentContainer ||
			options.handleGLSurfaceViewOnAndroid ||
			options.fileName !== undefined ||
			(options.useRenderInContext && !policy.renderInContext)
		) {
			throw new UnavailabilityError('Requested format/strategy in this Apple capture subset')
		}
		const view = validate(target)
		const scale = policy.scale(view)
		const naturalWidth = Math.ceil(view.bounds.size.width * scale)
		const naturalHeight = Math.ceil(view.bounds.size.height * scale)
		const width = options.width ?? naturalWidth
		const height = options.height ?? naturalHeight
		if (
			(policy.checkSourceDimensions && !withinLimits(naturalWidth, naturalHeight)) ||
			!withinLimits(width, height)
		) {
			throw new Error('Capture dimensions exceed the bitmap limit')
		}
		const data = policy.render(view, width, height, options)
		if (options.result === 'tmpfile') {
			const file = NSFileManager.defaultManager.temporaryDirectory.URLByAppendingPathComponent(
				`octane-view-shot-${NSUUID.UUID().UUIDString}.${options.format}`,
			)
			if (!data.writeToURLAtomically(file, true)) {
				throw new Error('Could not write the temporary capture')
			}
			const uri = String(file.absoluteString)
			owned.set(uri, file)
			return uri
		}
		const base64 = data.base64EncodedStringWithOptions(0)
		return options.result === 'data-uri'
			? `data:image/${options.format === 'jpg' ? 'jpeg' : 'png'};base64,${base64}`
			: base64
	}
	function remove(uri: string): boolean {
		if (!NSThread.isMainThread) {
			return false
		}
		const file = owned.get(uri)
		if (!file) {
			return true
		}
		try {
			if (NSFileManager.defaultManager.fileExistsAtPath(String(file.path))) {
				NSFileManager.defaultManager.removeItemAtURLError(file)
			}
			owned.delete(uri)
			return true
		} catch {
			return false
		}
	}
	return {
		capabilities: () => ({
			view: policy.available(),
			screen: policy.available() && Boolean(policy.screen),
			formats: policy.available() ? ['png', 'jpg'] : [],
			scrollContent: false,
		}),
		validate(target) {
			validate(target)
		},
		capture,
		async captureScreen(options) {
			if (!policy.screen) {
				throw new UnavailabilityError('App-screen capture on this host; use captureRef')
			}
			return capture(policy.screen(), options)
		},
		release(uri) {
			if (!uri.startsWith('file:')) {
				return
			}
			if (policy.available() && !remove(uri)) {
				throw new Error('Could not release the temporary capture')
			}
		},
		async waitForLayout(target, cancelled) {
			required()
			const start = Date.now()
			while (!cancelled()) {
				try {
					validate(target)
					return
				} catch (error) {
					if (Date.now() - start >= 1500) {
						throw error
					}
				}
				await new Promise<void>((resolve) => setTimeout(resolve, 16))
			}
			throw new Error('ViewShot unmounted while waiting for layout')
		},
	}
}
