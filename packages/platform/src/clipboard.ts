// Core provides native clipboard writes. Reads go straight to the OS
// clipboard managers (ClipboardManager / UIPasteboard). Keep every native
// lookup inside the calls — `Application.android.context` is undefined while
// the bundled entry evaluates, so nothing native may be read at module scope.
import { Application, Utils } from '@nativescript/core'
import { android } from '@octane-xplat/platform/android'
import { UIPasteboard } from '@octane-xplat/platform/ios'

export type Clipboard = {
	/** Whether the clipboard accepts writes. */
	canCopy: boolean
	/** Copy text to the clipboard. */
	writeText: typeof writeText
	/** Read clipboard text; null when empty/non-text. */
	readText: typeof readText
	/** Copy text to the clipboard. */
	write: typeof writeText
	/** Read the clipboard payload. */
	read: typeof readText
}

function toText(value: unknown): string | null {
	const text = value ? String(value) : ''
	return text || null
}

function read(): string | null {
	if (Application.android) {
		// `Utils.android` is a {} stub in the pinned Windows core build; this
		// branch only runs under the Application.android guard.
		const clipboard = (Utils.android as any)
			.getApplicationContext()
			?.getSystemService(
				android.content.Context.CLIPBOARD_SERVICE,
			) as android.content.ClipboardManager

		if (!clipboard?.hasPrimaryClip()) {
			return null
		}

		const mime = android.content.ClipDescription
		const description = clipboard.getPrimaryClipDescription()
		if (
			!description?.hasMimeType(mime.MIMETYPE_TEXT_PLAIN) &&
			!description?.hasMimeType(mime.MIMETYPE_TEXT_HTML)
		) {
			return null
		}

		return toText(clipboard.getPrimaryClip()?.getItemAt(0)?.getText())
	}

	if (Application.ios) {
		return toText(UIPasteboard.generalPasteboard.string)
	}

	return null
}

async function writeText(text: string): Promise<boolean> {
	try {
		Utils.copyToClipboard(text)
		return true
	} catch {
		return false
	}
}

async function readText(): Promise<string | null> {
	try {
		return read()
	} catch {
		return null
	}
}

/** System clipboard service. */
export const clipboard: Clipboard = {
	/** Whether the clipboard accepts writes. */
	canCopy: true,
	writeText,
	readText,
	// Keep the original names available for existing consumers.
	write: writeText,
	/** Read the clipboard payload. */
	read: readText,
}
