import {
	CGContextClearRect,
	CGContextRotateCTM,
	CGContextScaleCTM,
	CGContextTranslateCTM,
	NSData,
	NSBitmapImageRep,
	NSDeviceRGBColorSpace,
	NSFileManager,
	NSGraphicsContext,
	NSImage,
	NSImageCompressionFactor,
	NSNumber,
	NSURL,
	NSURLSession,
	NSUUID,
} from '@octane-xplat/platform/macos'
import type { NSHTTPURLResponse } from '@octane-xplat/platform/macos'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Frame, ImageBackend, Operation, Size } from './backend-types'
import { initialSize, outputSize } from './geometry'
import type { ImageLoadOptions, ImageResult, SaveOptions } from './types'

type ImageFrame = Frame<NSBitmapImageRep | null>
type Rect = { origin: { x: number; y: number }; size: Size }
const rect = (x: number, y: number, width: number, height: number): Rect => ({
	origin: { x, y },
	size: { width, height },
})

function pixels(frame: ImageFrame): NSBitmapImageRep {
	if (!frame.image) {
		throw new Error('Image pixels were released')
	}
	return frame.image
}

function imageFor(frame: ImageFrame): NSImage {
	const image = NSImage.alloc().initWithSize({ width: frame.width, height: frame.height })
	image.addRepresentation(pixels(frame))
	return image
}

function draw(size: Size, action: (context: NSGraphicsContext['CGContext']) => void): ImageFrame {
	const bitmap =
		NSBitmapImageRep.alloc().initWithBitmapDataPlanesPixelsWidePixelsHighBitsPerSampleSamplesPerPixelHasAlphaIsPlanarColorSpaceNameBytesPerRowBitsPerPixel(
			null,
			size.width,
			size.height,
			8,
			4,
			true,
			false,
			NSDeviceRGBColorSpace,
			0,
			0,
		)
	if (!bitmap) {
		throw new Error('Could not allocate image pixels')
	}
	const graphics = NSGraphicsContext.graphicsContextWithBitmapImageRep(bitmap)
	NSGraphicsContext.saveGraphicsState()
	try {
		CGContextClearRect(graphics.CGContext, rect(0, 0, size.width, size.height))
		// Transform the bitmap coordinate system to the top-left image convention.
		CGContextTranslateCTM(graphics.CGContext, 0, size.height)
		CGContextScaleCTM(graphics.CGContext, 1, -1)
		NSGraphicsContext.currentContext = NSGraphicsContext.graphicsContextWithCGContextFlipped(
			graphics.CGContext,
			true,
		)
		action(graphics.CGContext)
		graphics.flushGraphics()
		return { image: bitmap, ...size }
	} finally {
		NSGraphicsContext.restoreGraphicsState()
	}
}

function paint(image: NSImage, target: Rect): void {
	// NSCompositingOperationSourceOver = 2 (C enum; no runtime enum object required).
	image.drawInRectFromRectOperationFractionRespectFlippedHints(
		target,
		rect(0, 0, 0, 0),
		2,
		1,
		true,
		null,
	)
}

async function dataFor(uri: string): Promise<NSData> {
	if (/^https?:\/\//i.test(uri)) {
		const url = NSURL.URLWithString(uri)
		if (!url) {
			throw new TypeError('Invalid image URL')
		}
		return new Promise((resolve, reject) => {
			const task = NSURLSession.sharedSession.dataTaskWithURLCompletionHandler(
				url,
				(data, response, error) => {
					if (error || !data || (response as NSHTTPURLResponse).statusCode >= 400) {
						reject(new Error('Could not download the image'))
					} else {
						resolve(data)
					}
				},
			)
			task.resume()
		})
	}
	let data: NSData | null
	if (uri.startsWith('data:')) {
		const match = /^data:image\/[^;,]+;base64,([\s\S]+)$/i.exec(uri)
		if (!match) {
			throw new TypeError('Image data URIs must contain base64-encoded image bytes')
		}
		data = NSData.alloc().initWithBase64EncodedStringOptions(match[1], 0)
	} else {
		const local = uri.startsWith('file://') ? NSURL.URLWithString(uri)?.path : uri
		if (!local?.startsWith('/')) {
			throw new TypeError('AppKit image paths must be absolute file paths or file URLs')
		}
		data = NSData.dataWithContentsOfFile(local)
	}
	if (!data) {
		throw new Error('Could not read the image')
	}
	return data
}

async function load(uri: string, options: ImageLoadOptions): Promise<ImageFrame> {
	const data = await dataFor(uri)
	const representation = NSBitmapImageRep.imageRepWithData(data)
	if (!representation || representation.pixelsWide < 1 || representation.pixelsHigh < 1) {
		throw new Error('Could not decode the image')
	}
	const image = NSImage.alloc().initWithData(data)
	if (!image) {
		throw new Error('Could not decode the image')
	}
	const size = initialSize(
		{ width: representation.pixelsWide, height: representation.pixelsHigh },
		options,
	)
	return draw(size, () => paint(image, rect(0, 0, size.width, size.height)))
}

function transform(frame: ImageFrame, operation: Operation): ImageFrame {
	if (operation.kind === 'extent') {
		throw new UnavailabilityError('ImageManipulator.extent (web only)')
	}
	const size = outputSize(frame, operation)
	const image = imageFor(frame)
	return draw(size, (context) => {
		let target = rect(0, 0, frame.width, frame.height)
		switch (operation.kind) {
			case 'resize':
				target = rect(0, 0, size.width, size.height)
				break
			case 'crop':
				target.origin = { x: -operation.originX, y: -operation.originY }
				break
			case 'rotate':
				CGContextTranslateCTM(context, size.width / 2, size.height / 2)
				CGContextRotateCTM(context, (operation.degrees * Math.PI) / 180)
				target.origin = { x: -frame.width / 2, y: -frame.height / 2 }
				break
			case 'flip':
				CGContextTranslateCTM(
					context,
					operation.axis === 'horizontal' ? size.width : 0,
					operation.axis === 'vertical' ? size.height : 0,
				)
				CGContextScaleCTM(
					context,
					operation.axis === 'horizontal' ? -1 : 1,
					operation.axis === 'vertical' ? -1 : 1,
				)
		}
		paint(image, target)
	})
}

function removeOutput(uri: string): void {
	const local = NSURL.URLWithString(uri)?.path
	if (!local) {
		throw new TypeError('Invalid image output URL')
	}
	const manager = NSFileManager.defaultManager
	if (manager.fileExistsAtPath(local) && !manager.removeItemAtPathError(local, null)) {
		throw new Error('Could not remove the saved image')
	}
}

async function save(frame: ImageFrame, options: Required<SaveOptions>): Promise<ImageResult> {
	if (options.format === 'webp') {
		throw new UnavailabilityError('ImageManipulator WEBP encoding on AppKit')
	}
	const properties = { [NSImageCompressionFactor]: NSNumber.numberWithDouble(options.compress) }
	// NSBitmapImageFileTypePNG = 4; NSBitmapImageFileTypeJPEG = 3.
	const data = pixels(frame).representationUsingTypeProperties(
		options.format === 'png' ? 4 : 3,
		properties,
	)
	if (!data) {
		throw new Error('Image encoding failed')
	}
	const manager = NSFileManager.defaultManager
	const local = `${String(manager.temporaryDirectory.path).replace(/\/$/, '')}/xplat-image-${NSUUID.UUID().UUIDString}.${options.format === 'jpeg' ? 'jpg' : 'png'}`
	const uri = String(NSURL.fileURLWithPath(local).absoluteString)
	try {
		if (!data.writeToFileAtomically(local, true)) {
			throw new Error('Could not save the encoded image')
		}
		return {
			uri,
			width: frame.width,
			height: frame.height,
			...(options.base64 ? { base64: data.base64EncodedStringWithOptions(0) } : {}),
		}
	} catch (error) {
		removeOutput(uri)
		throw error
	}
}

export const backend: ImageBackend<NSBitmapImageRep | null> = {
	isAvailable: () =>
		typeof NSBitmapImageRep !== 'undefined' && typeof NSGraphicsContext !== 'undefined',
	load,
	transform,
	save,
	release: (frame) => {
		frame.image = null
	},
	releaseResult: removeOutput,
}
