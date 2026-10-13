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
 * Materialize a prepared icon as standalone SVG markup for the native
 * renderers (NativeScript SVGView, AppKit NSImage). Each icon source parses in
 * its own engine context, so the artwork's definition IDs stay stable: equal
 * (prepared, tint) pairs produce byte-identical markup, which lets
 * source-keyed host caches dedupe decode work across instances. Without a
 * color the markup keeps `currentColor`; native callers should supply a
 * concrete tint.
 */
export function materializeNanoIcon(prepared: PreparedNanoIcon, tint: NanoIconTint = {}): IconSvg {
	const color = escapeAttribute(tint.color ?? 'currentColor')
	const body = prepared.body.replace(/currentColor/g, () => color)
	return {
		body,
		viewBox: prepared.viewBox,
		width: prepared.width,
		height: prepared.height,
		markup: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${prepared.viewBox}" width="${prepared.width}" height="${prepared.height}" color="${color}" fill="${color}">${body}</svg>`,
	}
}
