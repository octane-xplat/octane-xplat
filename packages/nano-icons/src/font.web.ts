import { fontBytes } from './base64'
import type { NanoFontSource, NanoFontStatus } from './props'

const registrations = new Map<string, { status: Promise<NanoFontStatus>; usable: boolean }>()

function toFontSource(source: NanoFontSource): string | ArrayBuffer | undefined {
	if (source.url) {
		return `url("${source.url.replace(/"/g, '\\"')}")`
	}

	if (source.data) {
		const bytes = fontBytes(source.data)
		return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
	}

	return undefined
}

/**
 * Register a generated icon font with the document via `FontFace`. When no
 * `font` source is given, the app is expected to have linked it itself
 * (e.g. its own `@font-face`) — we check `document.fonts` either way so an
 * already-registered family resolves to `'ready'` without a reload.
 */
export function registerNanoIconFont(
	family: string,
	source?: NanoFontSource,
): Promise<NanoFontStatus> {
	const usable = !!(source?.url || source?.data)
	const pending = registrations.get(family)
	// Cache only attempts that carried a usable source for this platform — a
	// caller that couldn't provide one may retry when they can.
	if (pending && (pending.usable || !usable)) {
		return pending.status
	}

	const registration = (async (): Promise<NanoFontStatus> => {
		if (typeof document === 'undefined' || !document.fonts) {
			return 'unavailable'
		}

		if (document.fonts.check(`12px "${family}"`)) {
			return 'ready'
		}

		const fontData = source ? toFontSource(source) : undefined
		if (fontData === undefined) {
			console.warn(
				`[nano-icons] No font source for "${family}" — pass font.url/font.data to createNanoIconSet or register it with your own @font-face`,
			)

			return 'missing'
		}

		try {
			const face = new FontFace(family, fontData)
			await face.load()
			document.fonts.add(face)
			return 'ready'
		} catch (err) {
			console.warn(
				`[nano-icons] Failed to load font "${family}": ${err instanceof Error ? err.message : err}`,
			)

			return 'missing'
		}
	})()

	registrations.set(family, { status: registration, usable })
	return registration
}
