import {
	NSBitmapImageFileType,
	NSBitmapImageRep,
	NSColor,
	NSCompositingOperation,
	NSDeviceRGBColorSpace,
	NSDictionary,
	NSGraphicsContext,
	NSImage,
	NSImageCompressionFactor,
	NSImageInterpolation,
	NSRectFill,
	NSView,
	NSZeroRect,
} from '@octane-xplat/platform/macos'
import type { NSCopying } from '@octane-xplat/platform/macos'
import { createAppleBackend, type NativeData } from './backend.apple'
import type { CaptureBackend } from './backend-types'

// Rect constructors are ambient inline helpers the node-api runtime installs;
// they are not part of the generated SDK barrel.
declare function NSMakeRect(
	x: number,
	y: number,
	width: number,
	height: number,
): { origin: { x: number; y: number }; size: { width: number; height: number } }

export const backend: CaptureBackend = createAppleBackend({
	resolve(target) {
		if (!(target instanceof NSView)) {
			throw new TypeError('AppKit capture requires a mounted native NSView')
		}
		return target
	},
	renderInContext: false,
	// The generated barrel binds lazy proxies in ambient-free processes; read the
	// global directly so capability reflects a real ObjC bridge only.
	available: () => typeof Reflect.get(globalThis, 'NSBitmapImageRep') !== 'undefined',
	protectedView: ['WKWebView', 'NSOpenGLView', 'MTKView', 'AVPlayerView'],
	protectedLayer: ['AVPlayerLayer', 'CAMetalLayer', 'CAOpenGLLayer'],
	scale: (view) => {
		const window = view.window
		return window !== null &&
			window !== undefined &&
			'backingScaleFactor' in window &&
			typeof window.backingScaleFactor === 'number'
			? window.backingScaleFactor
			: 1
	},
	checkSourceDimensions: true,
	render(value, width, height, options): NativeData {
		const view = value as unknown as NSView
		const source = view.bitmapImageRepForCachingDisplayInRect(view.bounds)
		if (!source) {
			throw new Error('AppKit could not allocate the view cache')
		}
		view.cacheDisplayInRectToBitmapImageRep(view.bounds, source)
		const output = NSBitmapImageRep.alloc()
			.initWithBitmapDataPlanesPixelsWidePixelsHighBitsPerSampleSamplesPerPixelHasAlphaIsPlanarColorSpaceNameBytesPerRowBitsPerPixel(
				null,
				width,
				height,
				8,
				4,
				true,
				false,
				NSDeviceRGBColorSpace,
				0,
				0,
			)
		const context = output
			? NSGraphicsContext.graphicsContextWithBitmapImageRep(output)
			: null
		if (!output || !context) {
			throw new Error('AppKit could not allocate the output bitmap')
		}
		const image = NSImage.alloc().initWithSize(view.bounds.size)
		image.addRepresentation(source)
		NSGraphicsContext.saveGraphicsState()
		NSGraphicsContext.currentContext = context
		context.imageInterpolation = NSImageInterpolation.High
		const target = NSMakeRect(0, 0, width, height)
		;(options.format === 'jpg' ? NSColor.whiteColor : NSColor.clearColor).setFill()
		NSRectFill(target)
		image.drawInRectFromRectOperationFractionRespectFlippedHints(
			target,
			NSZeroRect,
			NSCompositingOperation.SourceOver,
			1,
			true,
			null,
		)
		context.flushGraphics()
		NSGraphicsContext.restoreGraphicsState()
		const encoded = output.representationUsingTypeProperties(
			options.format === 'png' ? NSBitmapImageFileType.PNG : NSBitmapImageFileType.JPEG,
			NSDictionary.dictionaryWithObjectForKey(
				options.quality,
				NSImageCompressionFactor as unknown as NSCopying,
			),
		)
		if (!encoded) {
			throw new Error('AppKit could not encode the capture')
		}
		return encoded
	},
})
