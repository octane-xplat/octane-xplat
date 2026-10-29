import { Orientation } from './types'
import type { PrintOptions, FilePrintOptions, PageMargins } from './types'
import type { NormalizedPrintOptions, NormalizedFileOptions } from './backend-types'
function object(value: unknown, keys: string[]): void {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new TypeError('Print options must be an object')
	}
	if (Object.keys(value).some((key) => !keys.includes(key))) {
		throw new TypeError('Unsupported print option')
	}
}
function pageSize(value: unknown, name: string): number {
	if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 14400) {
		throw new RangeError(`${name} must be greater than zero and at most 14400 points`)
	}
	return value
}
function layout(value: Pick<PrintOptions, 'width' | 'height' | 'margins' | 'orientation'>) {
	let width = pageSize(value.width ?? 612, 'width'),
		height = pageSize(value.height ?? 792, 'height')
	if (value.orientation !== undefined && !Object.values(Orientation).includes(value.orientation)) {
		throw new TypeError('Unknown print orientation')
	}
	if (value.orientation === 'landscape' && height > width) {
		;[width, height] = [height, width]
	}
	const margins: PageMargins = { top: 0, right: 0, bottom: 0, left: 0 }
	if (value.margins !== undefined) {
		object(value.margins, Object.keys(margins))
		for (const name of ['top', 'right', 'bottom', 'left'] as const) {
			const number = value.margins[name]
			if (typeof number !== 'number' || !Number.isFinite(number) || number < 0) {
				throw new RangeError('Margins must be nonnegative finite point values')
			}
			margins[name] = number
		}
	}
	if (margins.top + margins.bottom >= height || margins.left + margins.right >= width) {
		throw new RangeError('Margins must leave a positive printable area')
	}
	return { width, height, margins }
}
function optionalBoolean(value: unknown, name: string): void {
	if (value !== undefined && typeof value !== 'boolean') {
		throw new TypeError(`${name} must be boolean`)
	}
}
function optionalText(value: unknown, name: string): void {
	if (value !== undefined && typeof value !== 'string') {
		throw new TypeError(`${name} must be a string`)
	}
}
export function printOptions(value: PrintOptions): NormalizedPrintOptions {
	object(value, [
		'html',
		'uri',
		'width',
		'height',
		'margins',
		'orientation',
		'printerUrl',
		'useMarkupFormatter',
	])
	optionalText(value.html, 'html')
	optionalText(value.uri, 'uri')
	optionalText(value.printerUrl, 'printerUrl')
	optionalBoolean(value.useMarkupFormatter, 'useMarkupFormatter')
	if (value.html === undefined && value.uri === undefined && Object.keys(value).length > 0) {
		throw new TypeError(
			'Current-page printing takes an empty options object; provide HTML for page settings',
		)
	}
	if (value.html !== undefined && value.uri !== undefined) {
		throw new TypeError('Choose HTML or a PDF URI, not both')
	}
	if (value.uri !== undefined) {
		if (!value.uri.trim()) {
			throw new TypeError('PDF URI must not be empty')
		}
		if (
			value.width !== undefined ||
			value.height !== undefined ||
			value.margins !== undefined ||
			value.useMarkupFormatter === true
		) {
			throw new TypeError('Page layout options apply only to HTML')
		}
	}
	return { ...value, ...layout(value), useMarkupFormatter: value.useMarkupFormatter ?? false }
}
export function fileOptions(value: FilePrintOptions = {}): NormalizedFileOptions {
	object(value, ['html', 'width', 'height', 'margins', 'base64', 'useMarkupFormatter', 'textZoom'])
	optionalText(value.html, 'html')
	optionalBoolean(value.base64, 'base64')
	optionalBoolean(value.useMarkupFormatter, 'useMarkupFormatter')
	const textZoom = value.textZoom ?? 100
	if (!Number.isInteger(textZoom) || textZoom < 1 || textZoom > 500) {
		throw new RangeError('textZoom must be an integer from 1 to 500 percent')
	}
	return {
		...value,
		...layout(value),
		html: value.html ?? '',
		base64: value.base64 ?? false,
		useMarkupFormatter: value.useMarkupFormatter ?? false,
		textZoom,
	}
}
