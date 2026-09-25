import { registerElement } from '@nativescript-community/octane'
import type { Attributes } from '@nativescript-community/octane/intrinsics'
import { SVGView } from '@nativescript-community/ui-svg'
import type { IconGlyph } from './props'

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		svgview: Omit<Attributes<typeof SVGView>, 'src'> & {
			/** SVGView awaits promise srcs — remote .svg URLs arrive as fetched markup. */
			src?: string | Promise<string>
			stretch?: 'none' | 'fill' | 'aspectFit' | 'aspectFill'
		}
	}
}

// Required peer (Icon + Image leaves route SVG sources here unconditionally):
// SVGView renders via androidsvg on Android, SVGKit on iOS. Its src grammar is
// File / ImageAsset / res:// / ~/, or an inline markup string.
registerElement('svgview', SVGView)

const SVG_DATA_URI = /^data:image\/svg\+xml[;,]/i
const SVG_PATH = /\.svg([?#].*)?$/i
const EMPTY_SVG = '<svg xmlns="http://www.w3.org/2000/svg"/>'

/** True when an `src` carries SVG: inline markup, an svg data URI, or an
 *  .svg path/URL. Anything else stays on the raster <image> path. */
export function isSvgSrc(src: string): boolean {
	return src.trimStart().startsWith('<svg') || SVG_DATA_URI.test(src) || SVG_PATH.test(src)
}

/** Normalize an svg-shaped src into SVGView's grammar: file/resource paths and
 *  markup pass through, data URIs decode to markup, remote URLs fetch to
 *  markup (SVGView has no fetch of its own — it awaits promise srcs). */
export function svgSource(src: string): string | Promise<string> {
	if (SVG_DATA_URI.test(src)) {
		const comma = src.indexOf(',')
		const body = src.slice(comma + 1)
		if (src.slice(0, comma).endsWith(';base64')) {
			const atob = (globalThis as { atob?: (data: string) => string }).atob
			if (!atob) {
				return EMPTY_SVG
			}

			return atob(body)
		}

		return decodeURIComponent(body)
	}

	if (/^https?:\/\//.test(src)) {
		return fetch(src)
			.then((r) => (r.ok ? r.text() : EMPTY_SVG))
			.catch(() => EMPTY_SVG)
	}

	return src
}

/** IconGlyph → a full `<svg>` string for SVGView. `svg` path data gets a
 *  `<path>` with the requested fill; `markup` wraps inside a viewBox shell
 *  with `color`/`fill` set on the root so `currentColor` and default-fill
 *  children pick up the tint. */
export function glyphSvgMarkup(glyph: IconGlyph, color?: string): string | undefined {
	const viewBox = glyph.viewBox ?? '0 0 24 24'
	if (glyph.markup) {
		const tint = color ? ` color="${color}" fill="${color}"` : ''
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${tint}>${glyph.markup}</svg>`
	}

	if (glyph.svg) {
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><path d="${glyph.svg}" fill="${color ?? 'currentColor'}"/></svg>`
	}

	return undefined
}
