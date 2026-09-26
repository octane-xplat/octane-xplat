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

// Framework-provided glyphs for built-in affordances (SearchInput's leading
// glyph and clear button). Registered only when the name is free — an app
// registering the same name overrides the default.
if (!icons.has('xplat-search')) {
	icons.set('xplat-search', {
		svg: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
	})
}

if (!icons.has('xplat-clear')) {
	icons.set('xplat-clear', {
		svg: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
	})
}
