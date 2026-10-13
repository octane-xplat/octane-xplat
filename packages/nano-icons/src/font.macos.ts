// AppKit macOS font registration for generated icon fonts. Mirrors the
// harness font loader in apps/macos/src/fonts.ts: write/locate the TTF,
// create CTFontDescriptors through CoreText, then hand them to the renderer's
// family registry (`registerFontFamily`).
//
// Node builtins go through the host's `require` hook (the JSC bundle cannot
// resolve `node:` specifiers in imported ESM) — same convention as
// packages/sqlite's macOS backend.
import { registerFontFamily } from '@octane-xplat/macos-renderer'

import { fontBytes } from './base64'
import type { NanoFontSource, NanoFontStatus } from './props'

const host = globalThis as any

function nodeRequire(name: string): any {
	return host.require?.(name)
}

function cacheFontData(family: string, data: Uint8Array): string | undefined {
	const fs = nodeRequire('node:fs')
	const os = nodeRequire('node:os')
	const path = nodeRequire('node:path')
	if (!fs || !os || !path) {
		return undefined
	}

	// FNV-1a over the bytes — the host bridge cannot marshal typed arrays into
	// node:crypto, and a short content digest is all the cache file name needs.
	let digest = 0x811c9dc5
	for (let i = 0; i < data.length; i++) {
		digest = Math.imul(digest ^ data[i], 0x01000193) >>> 0
	}

	const dir = path.join(os.homedir(), 'Library', 'Caches', 'octane-xplat', 'macos', 'fonts')
	fs.mkdirSync(dir, { recursive: true })
	const fontPath = path.join(dir, `${family}-${digest.toString(16)}.ttf`)
	if (!fs.existsSync(fontPath)) {
		// The host's writeFileSync writes through NSData#writeToFileAtomically —
		// hand it an NSData built from the byte buffer.
		const copy = new Uint8Array(data.byteLength)
		copy.set(data)
		const nsData = NSData.dataWithBytesLength?.(copy.buffer, copy.byteLength)

		if (!nsData) {
			return undefined
		}

		fs.writeFileSync(fontPath, nsData)
	}

	return fontPath
}

/**
 * Register a generated icon font with the AppKit renderer's font registry.
 * Accepts `source.path` (a `.ttf` on disk) or `source.data` (raw TTF bytes —
 * persisted under `~/Library/Caches/octane-xplat/macos/fonts`). When neither
 * is given, the family may still resolve if the app registered or installed
 * it itself.
 */
export function registerNanoIconFont(
	family: string,
	source?: NanoFontSource,
): Promise<NanoFontStatus> {
	const usable = !!(source?.path || source?.data)
	const pending = registrations.get(family)
	// Cache only attempts that carried a usable source for this platform — a
	// caller that couldn't provide one may retry when they can.
	if (pending && (pending.usable || !usable)) {
		return pending.status
	}

	const registration = (async (): Promise<NanoFontStatus> => {
		try {
			if (typeof CTFontManagerCreateFontDescriptorsFromURL !== 'function') {
				return 'unavailable'
			}

			const data = source?.data ? fontBytes(source.data) : undefined

			const fontPath = source?.path ?? (data ? cacheFontData(family, data) : undefined)
			if (!fontPath) {
				console.warn(
					`[nano-icons] No font source for "${family}" — pass font.path or font.data (macOS), or register the family yourself`,
				)

				return 'missing'
			}

			const descriptors = CTFontManagerCreateFontDescriptorsFromURL(NSURL.fileURLWithPath(fontPath))

			const count = Number(descriptors?.count ?? 0)
			if (!descriptors || count === 0) {
				console.warn(`[nano-icons] No font descriptors in ${fontPath}`)
				return 'missing'
			}

			registerFontFamily(family, [
				{ weight: 400, descriptor: descriptors.objectAtIndex(0) as never },
			])

			return 'ready'
		} catch (err) {
			console.warn(
				`[nano-icons] Failed to register font "${family}": ${err instanceof Error ? err.message : err}`,
			)

			return 'missing'
		}
	})()

	registrations.set(family, { status: registration, usable })
	return registration
}

const registrations = new Map<string, { status: Promise<NanoFontStatus>; usable: boolean }>()

// Ambient bridge globals injected by @nativescript/macos-node-api.
declare const NSURL: {
	fileURLWithPath(path: string): unknown
}

declare const NSData: {
	dataWithBytesLength?(bytes: ArrayBuffer, length: number): unknown
}

declare function CTFontManagerCreateFontDescriptorsFromURL(url: unknown):
	| {
			count: number
			objectAtIndex(index: number): unknown
	  }
	| undefined
