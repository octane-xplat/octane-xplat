import type { Operation, Size } from './backend-types'
import type { ImageLoadOptions, ResizeOptions, SaveOptions } from './types'

export function positiveInteger(value: number, name: string): number {
	if (!Number.isSafeInteger(value) || value <= 0) {
		throw new RangeError(`${name} must be a positive integer`)
	}
	return value
}

export function loadOptions(options: ImageLoadOptions = {}): ImageLoadOptions {
	const result = { ...options }
	if (result.maxWidth !== undefined) {
		positiveInteger(result.maxWidth, 'maxWidth')
	}
	if (result.maxHeight !== undefined) {
		positiveInteger(result.maxHeight, 'maxHeight')
	}
	return result
}

export function resizeOperation(size: ResizeOptions): Operation {
	const width = size.width ?? null
	const height = size.height ?? null
	if (width === null && height === null) {
		throw new RangeError('resize requires width or height')
	}
	if (width !== null) {
		positiveInteger(width, 'width')
	}
	if (height !== null) {
		positiveInteger(height, 'height')
	}
	return { kind: 'resize', width, height }
}

export function validateRect(
	rect: { originX: number; originY: number; width: number; height: number },
	extent = false,
): void {
	positiveInteger(rect.width, 'width')
	positiveInteger(rect.height, 'height')
	for (const key of ['originX', 'originY'] as const) {
		if (!Number.isSafeInteger(rect[key]) || (!extent && rect[key] < 0)) {
			throw new RangeError(`${key} must be ${extent ? 'an' : 'a non-negative'} integer`)
		}
	}
}

export function outputSize(input: Size, operation: Operation): Size {
	switch (operation.kind) {
		case 'resize':
			return {
				width:
					operation.width ??
					Math.max(1, Math.round((input.width * operation.height!) / input.height)),
				height:
					operation.height ??
					Math.max(1, Math.round((input.height * operation.width!) / input.width)),
			}
		case 'rotate': {
			const radians = (operation.degrees * Math.PI) / 180
			// A tiny floating point residue at a quarter turn must not add a pixel.
			return {
				width: Math.max(
					1,
					Math.ceil(
						Math.abs(input.width * Math.cos(radians)) +
							Math.abs(input.height * Math.sin(radians)) -
							1e-9,
					),
				),
				height: Math.max(
					1,
					Math.ceil(
						Math.abs(input.width * Math.sin(radians)) +
							Math.abs(input.height * Math.cos(radians)) -
							1e-9,
					),
				),
			}
		}
		case 'crop':
			if (
				operation.originX + operation.width > input.width ||
				operation.originY + operation.height > input.height
			) {
				throw new RangeError('Crop rectangle exceeds the current image bounds')
			}
			return { width: operation.width, height: operation.height }
		case 'extent':
			return { width: operation.width, height: operation.height }
		case 'flip':
			return { width: input.width, height: input.height }
	}
}

export function initialSize(input: Size, options: ImageLoadOptions): Size {
	const ratio = Math.min(
		1,
		(options.maxWidth ?? input.width) / input.width,
		(options.maxHeight ?? input.height) / input.height,
	)
	return {
		width: Math.max(1, Math.round(input.width * ratio)),
		height: Math.max(1, Math.round(input.height * ratio)),
	}
}

export function saveOptions(options: SaveOptions = {}): Required<SaveOptions> {
	const format = options.format ?? 'jpeg'
	if (format !== 'jpeg' && format !== 'png' && format !== 'webp') {
		throw new TypeError('Unknown image format')
	}
	const compress = options.compress ?? 1
	if (!Number.isFinite(compress) || compress < 0 || compress > 1) {
		throw new RangeError('compress must be between 0 and 1')
	}
	if (options.base64 !== undefined && typeof options.base64 !== 'boolean') {
		throw new TypeError('base64 must be a boolean')
	}
	return { format, compress, base64: options.base64 ?? false }
}
