import { registerElement } from '@nativescript-community/octane'
import { SVGView } from './vendor/ui-svg/src'

// The emitted declaration keeps the import() form: declaration emit elides
// type-only imports referenced solely inside `declare module`, and the
// augmentation must still resolve Attributes when the module isn't otherwise
// loaded in the consumer's program.
declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		svgview: Omit<
			import('@nativescript-community/octane/intrinsics').Attributes<typeof SVGView>,
			'src'
		> & {
			/** SVGView awaits promise srcs — remote .svg URLs arrive as fetched markup. */
			src?: string | Promise<string>
			stretch?: 'none' | 'fill' | 'aspectFit' | 'aspectFill'
		}
	}
}

// Vendored ui-svg SVGView (Icon + Image + Meter route SVG sources here
// unconditionally): SVGView renders via androidsvg on Android, SVGKit on iOS.
// Its src grammar is File / ImageAsset / res:// / ~/, or an inline markup
// string.
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

export { glyphSvgMarkup } from './svg-glyph'
