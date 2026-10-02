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

if (!icons.has('xplat-copy')) {
	icons.set('xplat-copy', {
		svg: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
	})
}

if (!icons.has('xplat-check')) {
	icons.set('xplat-check', {
		svg: 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
	})
}

if (!icons.has('xplat-chevron-down')) {
	icons.set('xplat-chevron-down', {
		svg: 'M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z',
	})
}

if (!icons.has('xplat-chevron-up')) {
	icons.set('xplat-chevron-up', {
		svg: 'M12 8l-6 6 1.41 1.41L12 9.83l4.59 4.58L18 14z',
	})
}

if (!icons.has('xplat-doc-image')) {
	icons.set('xplat-doc-image', {
		svg: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
	})
}

if (!icons.has('xplat-more-horizontal')) {
	icons.set('xplat-more-horizontal', { svg: 'M5 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z' })
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

// Date/time/file affordances for the entry controls — same guarded
// registration; an app registering these names overrides the defaults.
if (!icons.has('xplat-calendar')) {
	icons.set('xplat-calendar', {
		svg: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z',
	})
}

if (!icons.has('xplat-clock')) {
	icons.set('xplat-clock', {
		svg: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
	})
}

if (!icons.has('xplat-upload')) {
	icons.set('xplat-upload', {
		svg: 'M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z',
	})
}

// Dialog/sheet affordances — close, and directional chevrons for Carousel
// and Lightbox navigation.
if (!icons.has('xplat-close')) {
	icons.set('xplat-close', {
		svg: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
	})
}

if (!icons.has('xplat-chevron-left')) {
	icons.set('xplat-chevron-left', {
		svg: 'M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z',
	})
}

if (!icons.has('xplat-chevron-right')) {
	icons.set('xplat-chevron-right', {
		svg: 'M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z',
	})
}

if (!icons.has('xplat-volume-off')) {
	icons.set('xplat-volume-off', {
		svg: 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.45-.54 2.78-1.32 3.97-2.27L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z',
	})
}

// Chat family glyphs — same guarded registration; apps may override any name.
if (!icons.has('xplat-send')) {
	icons.set('xplat-send', { svg: 'M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z' })
}

if (!icons.has('xplat-stop')) {
	icons.set('xplat-stop', { svg: 'M6 6h12v12H6z' })
}

if (!icons.has('xplat-chevron-down')) {
	icons.set('xplat-chevron-down', {
		svg: 'M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z',
	})
}

if (!icons.has('xplat-clock')) {
	icons.set('xplat-clock', {
		svg: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
	})
}

if (!icons.has('xplat-check')) {
	icons.set('xplat-check', { svg: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' })
}

if (!icons.has('xplat-check-double')) {
	icons.set('xplat-check-double', {
		svg: 'M0.41 13.41L6 19l1.41-1.42L1.83 12zM22.24 5.58L11.66 16.17 7.5 12l-1.43 1.41 5.59 5.59L23.66 7zM18 7l-1.41-1.42-6.35 6.35 1.41 1.41L18 7z',
	})
}

if (!icons.has('xplat-error')) {
	icons.set('xplat-error', {
		svg: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
	})
}

if (!icons.has('xplat-warning')) {
	icons.set('xplat-warning', {
		svg: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
	})
}

if (!icons.has('xplat-wrench')) {
	icons.set('xplat-wrench', {
		svg: 'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z',
	})
}

if (!icons.has('xplat-mic')) {
	icons.set('xplat-mic', {
		svg: 'M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z',
	})
}
