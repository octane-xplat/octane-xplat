import type { CaptureOptions, NormalizedCaptureOptions } from './types'

const keys = new Set([
	'fileName',
	'width',
	'height',
	'format',
	'quality',
	'result',
	'snapshotContentContainer',
	'handleGLSurfaceViewOnAndroid',
	'useRenderInContext',
])
/** Bound decoded/native bitmap allocation to 32 million pixels, including the default host scale. */
export const MAX_CAPTURE_PIXELS = 32_000_000
export function checkDimensions(width: number, height: number): void {
	if (
		!Number.isInteger(width) ||
		!Number.isInteger(height) ||
		width <= 0 ||
		height <= 0 ||
		width > 16384 ||
		height > 16384 ||
		width * height > MAX_CAPTURE_PIXELS
	) {
		throw new RangeError(
			'Capture dimensions must be positive integers up to 16384 and at most 32000000 total pixels',
		)
	}
}
export function normalizeOptions(options: CaptureOptions = {}): NormalizedCaptureOptions {
	if (
		!options ||
		typeof options !== 'object' ||
		Array.isArray(options) ||
		Object.keys(options).some((key) => !keys.has(key))
	) {
		throw new TypeError('Invalid view capture options')
	}
	if ((options.width === undefined) !== (options.height === undefined)) {
		throw new RangeError('Supply both final width and height, or omit both')
	}
	if (options.width !== undefined) {
		checkDimensions(options.width, options.height!)
	}
	const format = options.format ?? 'png'
	if (format !== 'png' && format !== 'jpg' && format !== 'webp') {
		throw new RangeError('This capture subset supports png, jpg and platform-supported webp')
	}
	const result = options.result ?? 'tmpfile'
	if (result !== 'tmpfile' && result !== 'base64' && result !== 'data-uri') {
		throw new RangeError('This capture subset supports tmpfile, base64 and data-uri')
	}
	const quality = options.quality ?? 1
	if (typeof quality !== 'number' || !Number.isFinite(quality) || quality < 0 || quality > 1) {
		throw new RangeError('Capture quality must be between 0 and 1')
	}
	if (
		options.fileName !== undefined &&
		(typeof options.fileName !== 'string' ||
			options.fileName.length < 3 ||
			options.fileName.length > 80 ||
			!/^[a-zA-Z0-9_-]+$/.test(options.fileName))
	) {
		throw new TypeError(
			'Capture fileName must be 3–80 ASCII letters, digits, underscores or hyphens',
		)
	}
	for (const key of [
		'snapshotContentContainer',
		'handleGLSurfaceViewOnAndroid',
		'useRenderInContext',
	] as const) {
		if (options[key] !== undefined && typeof options[key] !== 'boolean') {
			throw new TypeError(`${key} must be a Boolean`)
		}
	}
	return Object.freeze({
		fileName: options.fileName,
		width: options.width,
		height: options.height,
		format,
		result,
		quality,
		snapshotContentContainer: options.snapshotContentContainer ?? false,
		handleGLSurfaceViewOnAndroid: options.handleGLSurfaceViewOnAndroid ?? false,
		useRenderInContext: options.useRenderInContext ?? false,
	})
}
