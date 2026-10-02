import type { IconGlyph } from './props'

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
