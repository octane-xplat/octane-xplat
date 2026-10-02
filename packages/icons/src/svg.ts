import type { IconifyIcon } from '@iconify/types'
import { iconToSVG } from '@iconify/utils/lib/svg/build'
import { replaceIDs } from '@iconify/utils/lib/svg/id'
import type { IconOptions, IconSvg } from './props'

function escapeAttribute(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('"', '&quot;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
}

/**
 * Convert trusted icon data to SVG without DOM APIs. Applies transforms, keeps
 * multicolor fills, and gives definitions unique IDs on every invocation.
 * Without a color, markup uses currentColor; native callers should supply a
 * concrete tint. This is a converter, not an SVG sanitizer.
 * @throws RangeError if size is not finite and positive.
 */
export function iconToSvg(icon: IconifyIcon, options: IconOptions = {}): IconSvg {
	const size = options.size ?? 24
	if (!Number.isFinite(size) || size <= 0) {
		throw new RangeError('Icon size must be finite and positive')
	}

	const result = iconToSVG(icon, {
		height: size,
		rotate: options.rotate ?? 0,
		hFlip: options.hFlip ?? false,
		vFlip: options.vFlip ?? false,
	})

	const color = escapeAttribute(options.color ?? 'currentColor')
	const body = replaceIDs(result.body).replace(/currentColor/g, () => color)
	const viewBox = result.attributes.viewBox
	const width = Number(result.attributes.width)
	const height = Number(result.attributes.height)
	return {
		body,
		viewBox,
		width,
		height,
		markup: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${viewBox}" width="${width}" height="${height}" color="${color}" fill="${color}">${body}</svg>`,
	}
}
