import { Application, ImageSource, knownFolders, path } from '@nativescript/core'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Frame, ImageBackend, Operation } from './backend-types'
import { initialSize, outputSize } from './geometry'
import { encodedSource, mobileSource, removeOutput } from './source.mobile'
import type { ImageLoadOptions, ImageResult, SaveOptions } from './types'

type Bitmap = android.graphics.Bitmap
type ImageFrame = Frame<Bitmap | null>

function pixels(frame: ImageFrame): Bitmap {
	if (!frame.image || frame.image.isRecycled()) {
		throw new Error('Image pixels were released')
	}
	return frame.image
}

function orient(image: Bitmap, orientation: number): Bitmap {
	if (orientation === 1) {
		return image
	}
	const matrix = new android.graphics.Matrix()
	switch (orientation) {
		case 2:
			matrix.setScale(-1, 1)
			break
		case 3:
			matrix.setRotate(180)
			break
		case 4:
			matrix.setScale(1, -1)
			break
		case 5:
			matrix.setRotate(90)
			matrix.postScale(-1, 1)
			break
		case 6:
			matrix.setRotate(90)
			break
		case 7:
			matrix.setRotate(90)
			matrix.postScale(1, -1)
			break
		case 8:
			matrix.setRotate(270)
			break
		default:
			return image
	}
	const normalized = android.graphics.Bitmap.createBitmap(
		image,
		0,
		0,
		image.getWidth(),
		image.getHeight(),
		matrix,
		true,
	)
	if (normalized !== image) {
		image.recycle()
	}
	return normalized
}

async function load(uri: string, options: ImageLoadOptions): Promise<ImageFrame> {
	const input = await mobileSource(uri)
	let image: Bitmap | null = null
	try {
		let orientation = 1
		if (input.uri.startsWith('data:')) {
			const bytes = android.util.Base64.decode(
				encodedSource(input.uri),
				android.util.Base64.DEFAULT,
			)
			image = android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.length)
			const stream = new java.io.ByteArrayInputStream(bytes)
			try {
				orientation = new android.media.ExifInterface(stream).getAttributeInt('Orientation', 1)
			} finally {
				stream.close()
			}
		} else if (input.uri.startsWith('content://')) {
			const resolver = Application.android.context.getContentResolver()
			const location = android.net.Uri.parse(input.uri)
			const stream = resolver.openInputStream(location)
			if (!stream) {
				throw new Error('Could not open the image')
			}
			try {
				image = android.graphics.BitmapFactory.decodeStream(stream)
			} finally {
				stream.close()
			}
			const metadata = resolver.openInputStream(location)
			if (metadata) {
				try {
					orientation = new android.media.ExifInterface(metadata).getAttributeInt('Orientation', 1)
				} finally {
					metadata.close()
				}
			}
		} else if (input.uri.startsWith('res://')) {
			const resource: Bitmap | undefined = ImageSource.fromResourceSync(input.uri.slice(6))?.android
			image = resource?.copy(android.graphics.Bitmap.Config.ARGB_8888, false) ?? null
		} else {
			image = android.graphics.BitmapFactory.decodeFile(input.uri)
			if (image) {
				orientation = new android.media.ExifInterface(input.uri).getAttributeInt('Orientation', 1)
			}
		}
		if (!image) {
			throw new Error('Could not decode the image')
		}
		image = orient(image, orientation)
		const frame = { image, width: image.getWidth(), height: image.getHeight() }
		const size = initialSize(frame, options)
		if (size.width === frame.width && size.height === frame.height) {
			image = null
			return frame
		}
		return transform(frame, { kind: 'resize', ...size })
	} finally {
		image?.recycle()
		input.release()
	}
}

function transform(frame: ImageFrame, operation: Operation): ImageFrame {
	if (operation.kind === 'extent') {
		throw new UnavailabilityError('ImageManipulator.extent (web only)')
	}
	const source = pixels(frame)
	const size = outputSize(frame, operation)
	const image = android.graphics.Bitmap.createBitmap(
		size.width,
		size.height,
		android.graphics.Bitmap.Config.ARGB_8888,
	)
	try {
		const canvas = new android.graphics.Canvas(image)
		const paint = new android.graphics.Paint(
			android.graphics.Paint.ANTI_ALIAS_FLAG | android.graphics.Paint.FILTER_BITMAP_FLAG,
		)
		switch (operation.kind) {
			case 'resize':
				canvas.drawBitmap(
					source,
					null,
					new android.graphics.RectF(0, 0, size.width, size.height),
					paint,
				)
				break
			case 'crop':
				canvas.drawBitmap(source, -operation.originX, -operation.originY, paint)
				break
			case 'rotate':
				canvas.translate(size.width / 2, size.height / 2)
				canvas.rotate(operation.degrees)
				canvas.drawBitmap(source, -frame.width / 2, -frame.height / 2, paint)
				break
			case 'flip':
				canvas.translate(
					operation.axis === 'horizontal' ? size.width : 0,
					operation.axis === 'vertical' ? size.height : 0,
				)
				canvas.scale(
					operation.axis === 'horizontal' ? -1 : 1,
					operation.axis === 'vertical' ? -1 : 1,
				)
				canvas.drawBitmap(source, 0, 0, paint)
		}
		return { image, ...size }
	} catch (error) {
		image.recycle()
		throw error
	}
}

async function save(frame: ImageFrame, options: Required<SaveOptions>): Promise<ImageResult> {
	const stream = new java.io.ByteArrayOutputStream()
	let output: java.io.FileOutputStream | undefined
	const local = path.join(
		knownFolders.temp().path,
		`xplat-image-${java.util.UUID.randomUUID().toString()}.${options.format === 'jpeg' ? 'jpg' : options.format}`,
	)
	try {
		const format =
			options.format === 'png'
				? android.graphics.Bitmap.CompressFormat.PNG
				: options.format === 'jpeg'
					? android.graphics.Bitmap.CompressFormat.JPEG
					: android.os.Build.VERSION.SDK_INT >= 30
						? android.graphics.Bitmap.CompressFormat.WEBP_LOSSY
						: android.graphics.Bitmap.CompressFormat.WEBP
		if (!pixels(frame).compress(format, Math.round(options.compress * 100), stream)) {
			throw new Error('Image encoding failed')
		}
		const bytes = stream.toByteArray()
		output = new java.io.FileOutputStream(local)
		output.write(bytes)
		output.close()
		output = undefined
		return {
			uri: `file://${local}`,
			width: frame.width,
			height: frame.height,
			...(options.base64
				? { base64: android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP) }
				: {}),
		}
	} catch (error) {
		output?.close()
		removeOutput(local)
		throw error
	} finally {
		stream.close()
	}
}

export const backend: ImageBackend<Bitmap | null> = {
	isAvailable: () => typeof android !== 'undefined' && Boolean(Application.android),
	load,
	transform,
	save,
	release: (frame) => {
		frame.image?.recycle()
		frame.image = null
	},
	releaseResult: removeOutput,
}
