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

export { glyphSvgMarkup } from './svg-glyph'
