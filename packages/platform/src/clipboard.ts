// Core provides native clipboard writes. Reads go straight to the OS
// clipboard managers (ClipboardManager / UIPasteboard). Keep every native
// lookup inside the calls — `Application.android.context` is undefined while
// the bundled entry evaluates, so nothing native may be read at module scope.
import { Application, Utils } from '@nativescript/core'

function toText(value: unknown): string | null {
	const text = value ? String(value) : ''
	return text || null
}

function read(): string | null {
	if (Application.android) {
		const clipboard = Utils.android
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

export const clipboard = {
	canCopy: true,
	writeText,
	readText,
	// Keep the original names available for existing consumers.
	write: writeText,
	read: readText,
}
