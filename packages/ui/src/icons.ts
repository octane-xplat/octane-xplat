import type { IconGlyph } from './props'
export type { IconGlyph } from './props'

/**
 * App-owned icon registry. `svg` is SVG path `d` data (not a full SVG
 * markup string). `src` can carry an image or an SVG source; the leaves only
 * infer SVG from inline markup, SVG data URIs, and `.svg` paths/URLs. Native
 * `font` glyphs render only when the app ships and registers that font.
 */
const icons = new Map<string, IconGlyph>()

export function registerIcon(name: string, glyph: IconGlyph): void {
	icons.set(name, glyph)
}

export function registerIcons(record: Record<string, IconGlyph>): void {
	for (const [name, glyph] of Object.entries(record)) {
		icons.set(name, glyph)
	}
}

export function getIcon(name: string): IconGlyph | undefined {
	return icons.get(name)
}
