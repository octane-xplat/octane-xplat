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

// Video transport glyphs (self-drawn chrome) — same guarded registration.
if (!icons.has('xplat-play')) {
	icons.set('xplat-play', { svg: 'M8 5v14l11-7z' })
}

if (!icons.has('xplat-pause')) {
	icons.set('xplat-pause', { svg: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z' })
}

if (!icons.has('xplat-volume')) {
	icons.set('xplat-volume', {
		svg: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
	})
}

if (!icons.has('xplat-volume-off')) {
	icons.set('xplat-volume-off', {
		svg: 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.45-.54 2.78-1.32 3.97-2.27L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z',
	})
}
