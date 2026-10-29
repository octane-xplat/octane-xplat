import type { Frame, ImageBackend, Operation } from './backend-types'
import { initialSize, outputSize } from './geometry'
import type { ImageLoadOptions, ImageResult, SaveOptions } from './types'

function canvas(width: number, height: number): HTMLCanvasElement {
	const result = document.createElement('canvas')
	result.width = width
	result.height = height
	return result
}

function context(image: HTMLCanvasElement): CanvasRenderingContext2D {
	const ctx = image.getContext('2d')
	if (!ctx) {
		throw new Error('A 2D image canvas is unavailable')
	}
	return ctx
}

function dispose(image: HTMLCanvasElement): void {
	image.width = 0
	image.height = 0
}

async function load(uri: string, options: ImageLoadOptions): Promise<Frame<HTMLCanvasElement>> {
	const source = new Image()
	source.crossOrigin = 'anonymous'
	source.src = uri
	await source.decode()
	const size = initialSize({ width: source.naturalWidth, height: source.naturalHeight }, options)
	const image = canvas(size.width, size.height)
	try {
		context(image).drawImage(source, 0, 0, size.width, size.height)
		return { image, ...size }
	} catch (error) {
		dispose(image)
		throw error
	} finally {
		source.removeAttribute('src')
	}
}

function transform(
	frame: Frame<HTMLCanvasElement>,
	operation: Operation,
): Frame<HTMLCanvasElement> {
	const size = outputSize(frame, operation)
	const image = canvas(size.width, size.height)
	try {
		const ctx = context(image)
		switch (operation.kind) {
			case 'resize':
				ctx.drawImage(frame.image, 0, 0, size.width, size.height)
				break
			case 'crop':
				ctx.drawImage(frame.image, -operation.originX, -operation.originY)
				break
			case 'rotate':
				ctx.translate(size.width / 2, size.height / 2)
				ctx.rotate((operation.degrees * Math.PI) / 180)
				ctx.drawImage(frame.image, -frame.width / 2, -frame.height / 2)
				break
			case 'flip':
				ctx.translate(
					operation.axis === 'horizontal' ? size.width : 0,
					operation.axis === 'vertical' ? size.height : 0,
				)
				ctx.scale(operation.axis === 'horizontal' ? -1 : 1, operation.axis === 'vertical' ? -1 : 1)
				ctx.drawImage(frame.image, 0, 0)
				break
			case 'extent':
				if (operation.backgroundColor !== null) {
					// Invalid CSS colors otherwise silently retain the previous fillStyle.
					if (!CSS.supports('color', operation.backgroundColor)) {
						throw new TypeError('Invalid backgroundColor')
					}
					ctx.fillStyle = operation.backgroundColor
					ctx.fillRect(0, 0, size.width, size.height)
				}
				ctx.drawImage(frame.image, operation.originX, operation.originY)
		}
		return { image, ...size }
	} catch (error) {
		dispose(image)
		throw error
	}
}

async function save(
	frame: Frame<HTMLCanvasElement>,
	options: Required<SaveOptions>,
): Promise<ImageResult> {
	const mimeType = `image/${options.format}`
	const blob = await new Promise<Blob>((resolve, reject) => {
		frame.image.toBlob(
			(value) => (value ? resolve(value) : reject(new Error('Image encoding failed'))),
			mimeType,
			options.compress,
		)
	})
	if (blob.type !== mimeType) {
		throw new Error(`Encoding ${mimeType} is unavailable on this host`)
	}
	let base64: string | undefined
	if (options.base64) {
		base64 = await new Promise<string>((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = () => resolve(String(reader.result).split(',')[1])
			reader.onerror = () => reject(new Error('Could not read the encoded image'))
			reader.readAsDataURL(blob)
		})
	}
	return {
		uri: URL.createObjectURL(blob),
		width: frame.width,
		height: frame.height,
		...(base64 === undefined ? {} : { base64 }),
	}
}

export const backend: ImageBackend<HTMLCanvasElement> = {
	isAvailable: () =>
		typeof document !== 'undefined' &&
		typeof Image !== 'undefined' &&
		typeof URL.createObjectURL === 'function',
	load,
	transform,
	save,
	release: (frame) => dispose(frame.image),
	releaseResult: (uri) => URL.revokeObjectURL(uri),
}
