// Native (iOS/Android) font registration for generated icon fonts.
//
// NativeScript resolves custom fonts by file name inside the app's `fonts`
// directory (`app/fonts/<family>.ttf`): iOS registers every `.ttf`/`.otf`
// there at startup and looks them up by internal family name; Android builds
// a Typeface lazily from the file matching the requested `fontFamily`. There
// is no supported hook to inject a runtime Typeface on Android, so the TTF
// must ship inside the app — `registerNanoIconFont` verifies that and, on
// iOS, can also register bytes/paths at runtime through CoreText.
import { File, isAndroid, isIOS, knownFolders, path } from '@nativescript/core'
import { fontBytes } from './base64'
import type { NanoFontSource, NanoFontStatus } from './props'

// Ambient iOS runtime globals (NativeScript bridge).
declare const UIFont: {
	fontWithNameSize?(name: string, size: number): unknown
}

declare const NSData: {
	dataWithContentsOfFile?(path: string): unknown
}

declare function CGDataProviderCreateWithCFData(data: unknown): unknown
declare function CGFontCreateWithDataProvider(provider: unknown): unknown
declare function CTFontManagerRegisterGraphicsFont(font: unknown, error: unknown): boolean

const registrations = new Map<string, { status: Promise<NanoFontStatus>; usable: boolean }>()

function iosFontAvailable(family: string): boolean {
	return typeof UIFont !== 'undefined' && !!UIFont.fontWithNameSize?.(family, 12)
}

function iosRegisterFontFile(filePath: string): boolean {
	if (typeof NSData?.dataWithContentsOfFile !== 'function') {
		return false
	}

	try {
		const data = NSData.dataWithContentsOfFile(filePath)
		const provider = CGDataProviderCreateWithCFData(data)
		const font = CGFontCreateWithDataProvider(provider)
		if (!font) {
			return false
		}

		return CTFontManagerRegisterGraphicsFont(font, null)
	} catch {
		return false
	}
}

function iosRegisterData(family: string, data: Uint8Array): boolean {
	// Persist bytes to the temp folder, then register through CoreText —
	// avoids manual pointer marshaling into NSData.
	try {
		const filePath = path.join(knownFolders.temp().path, `${family}.ttf`)
		File.fromPath(filePath).writeSync(data)
		return iosRegisterFontFile(filePath)
	} catch {
		return false
	}
}

function iosRegisterFile(fileName: string): boolean {
	const fontsPath = path.join(knownFolders.currentApp().path, 'fonts', fileName)
	const appPath = path.join(knownFolders.currentApp().path, fileName)
	const filePath = File.exists(fontsPath) ? fontsPath : File.exists(appPath) ? appPath : null
	if (!filePath) {
		return false
	}

	return iosRegisterFontFile(filePath)
}

/**
 * Verify/register a generated icon font on iOS or Android.
 *
 * - `source.fileName` (default `<family>.ttf`) — file inside `app/fonts`.
 *   Both platforms resolve the family from that file; this is the supported
 *   static delivery mode.
 * - `source.data` — iOS only: registers raw TTF bytes through CoreText.
 */
export function registerNanoIconFont(
	family: string,
	source?: NanoFontSource,
): Promise<NanoFontStatus> {
	const usable = !!(source?.fileName || source?.data)
	const pending = registrations.get(family)
	// Cache only attempts that carried a usable source for this platform — a
	// caller that couldn't provide one may retry when they can.
	if (pending && (pending.usable || !usable)) {
		return pending.status
	}

	const registration = (async (): Promise<NanoFontStatus> => {
		if (isIOS) {
			if (iosFontAvailable(family)) {
				return 'ready'
			}

			if (source?.data && iosRegisterData(family, fontBytes(source.data))) {
				return iosFontAvailable(family) ? 'ready' : 'missing'
			}

			const fileName = source?.fileName ?? `${family}.ttf`
			if (iosRegisterFile(fileName) && iosFontAvailable(family)) {
				return 'ready'
			}

			console.warn(
				`[nano-icons] Font "${family}" not found — copy ${fileName} into the app's fonts directory (app/fonts)`,
			)

			return 'missing'
		}

		if (isAndroid) {
			const fileName = source?.fileName ?? `${family}.ttf`
			const exists = File.exists(path.join(knownFolders.currentApp().path, 'fonts', fileName))

			if (!exists) {
				console.warn(
					`[nano-icons] Font file ${fileName} not in app/fonts — Android resolves icon fonts by file name`,
				)

				return 'missing'
			}

			return 'ready'
		}

		return 'unavailable'
	})()

	registrations.set(family, { status: registration, usable })
	return registration
}
