import { File, ImageSource, knownFolders, path } from '@nativescript/core'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Frame, ImageBackend, Operation, Size } from './backend-types'
import { initialSize, outputSize } from './geometry'
import { encodedSource, mobileSource, removeOutput } from './source.mobile'
import type { ImageLoadOptions, ImageResult, SaveOptions } from './types'

type ImageFrame = Frame<UIImage | null>
type GraphicsContext = Parameters<typeof CGContextTranslateCTM>[0]
// UIKit's C enum has no runtime object under TypeScript type stripping.
// Left, right, left-mirrored and right-mirrored swap the physical dimensions.
const sidewaysOrientations = new Set<number>([2, 3, 6, 7])

function pixels(frame: ImageFrame): UIImage {
	if (!frame.image) {
		throw new Error('Image pixels were released')
	}
	return frame.image
}

function draw(size: Size, action: (context: GraphicsContext) => void): ImageFrame {
	const format = UIGraphicsImageRendererFormat.defaultFormat()
	format.scale = 1
	format.opaque = false
	const renderer = UIGraphicsImageRenderer.alloc().initWithSizeFormat(size, format)
	const image = renderer.imageWithActions((context) => action(context.CGContext))
	if (!image) {
		throw new Error('Image rendering failed')
	}
	return { image, ...size }
}

async function load(uri: string, options: ImageLoadOptions): Promise<ImageFrame> {
	const input = await mobileSource(uri)
	try {
		const source = input.uri.startsWith('data:')
			? ImageSource.fromBase64Sync(encodedSource(input.uri))
			: ImageSource.fromFileOrResourceSync(input.uri)
		const image: UIImage | undefined = source?.ios
		if (!image?.CGImage) {
			throw new Error('Could not decode the image')
		}
		const sideways = sidewaysOrientations.has(image.imageOrientation)
		const width = CGImageGetWidth(image.CGImage)
		const height = CGImageGetHeight(image.CGImage)
		const size = initialSize(
			sideways ? { width: height, height: width } : { width, height },
			options,
		)
		// UIImage drawing normalizes all EXIF rotations/reflections at physical scale 1.
		return draw(size, () => image.drawInRect({ origin: { x: 0, y: 0 }, size }))
	} finally {
		input.release()
	}
}

function transform(frame: ImageFrame, operation: Operation): ImageFrame {
	if (operation.kind === 'extent') {
		throw new UnavailabilityError('ImageManipulator.extent (web only)')
	}
	const image = pixels(frame)
	const size = outputSize(frame, operation)
	return draw(size, (context) => {
		let x = 0,
			y = 0,
			width = frame.width,
			height = frame.height
		switch (operation.kind) {
			case 'resize':
				width = size.width
				height = size.height
				break
			case 'crop':
				x = -operation.originX
				y = -operation.originY
				break
			case 'rotate':
				CGContextTranslateCTM(context, size.width / 2, size.height / 2)
				CGContextRotateCTM(context, (operation.degrees * Math.PI) / 180)
				x = -frame.width / 2
				y = -frame.height / 2
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
		image.drawInRect({ origin: { x, y }, size: { width, height } })
	})
}

async function save(frame: ImageFrame, options: Required<SaveOptions>): Promise<ImageResult> {
	if (options.format === 'webp') {
		throw new UnavailabilityError('ImageManipulator WEBP encoding on iOS')
	}
	const data =
		options.format === 'png'
			? UIImagePNGRepresentation(pixels(frame))
			: UIImageJPEGRepresentation(pixels(frame), options.compress)
	if (!data) {
		throw new Error('Image encoding failed')
	}
	const local = path.join(
		knownFolders.temp().path,
		`xplat-image-${NSUUID.UUID().UUIDString}.${options.format === 'jpeg' ? 'jpg' : 'png'}`,
	)
	try {
		if (!data.writeToFileAtomically(local, true)) {
			throw new Error('Could not save the encoded image')
		}
		return {
			uri: String(NSURL.fileURLWithPath(local).absoluteString),
			width: frame.width,
			height: frame.height,
			...(options.base64
				? { base64: data.base64EncodedStringWithOptions(0 as NSDataBase64EncodingOptions) }
				: {}),
		}
	} catch (error) {
		if (File.exists(local)) {
			File.fromPath(local).removeSync()
		}
		throw error
	}
}

export const backend: ImageBackend<UIImage | null> = {
	isAvailable: () => typeof UIGraphicsImageRenderer !== 'undefined',
	load,
	transform,
	save,
	release: (frame) => {
		frame.image = null
	},
	releaseResult: removeOutput,
}
