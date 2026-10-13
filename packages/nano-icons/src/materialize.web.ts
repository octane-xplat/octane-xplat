import { replaceIDs } from '@iconify/utils/lib/svg/id'
import type { IconSvg } from '@octane-xplat/icons'
import type { NanoIconTint, PreparedNanoIcon } from './props'

function escapeAttribute(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('"', '&quot;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
}

/**
 * Materialize a prepared icon for inline DOM SVG. Live documents share the
 * page's id space, so every call rewrites definition IDs to unique values —
 * same contract as `@octane-xplat/icons`' `iconToSvg`; the prepared
 * normalization behind it is shared. Without a color the body keeps
 * `currentColor` and inherits from CSS.
 */
export function materializeNanoIcon(prepared: PreparedNanoIcon, tint: NanoIconTint = {}): IconSvg {
	const color = escapeAttribute(tint.color ?? 'currentColor')
	const body = replaceIDs(prepared.body).replace(/currentColor/g, () => color)
	return {
		body,
		viewBox: prepared.viewBox,
		width: prepared.width,
		height: prepared.height,
		markup: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${prepared.viewBox}" width="${prepared.width}" height="${prepared.height}" color="${color}" fill="${color}">${body}</svg>`,
	}
}
