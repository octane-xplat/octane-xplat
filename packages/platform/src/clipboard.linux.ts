// Clipboard — Linux leaf. Prefers the host bridge (GtkClipboard/Gdk.Clipboard
// on the real host, NSPasteboard in the WKWebView dev harness); falls back to
// navigator.clipboard for plain-browser dev against the same server.
import { bridged, call } from './bridge'

const canDom =
	typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function'

async function writeText(text: string): Promise<boolean> {
	if (bridged()) {
		return call<boolean>('clipboard', 'write', text)
	}

	try {
		await navigator.clipboard.writeText(text)
		return true
	} catch {
		return false
	}
}

async function readText(): Promise<string | null> {
	if (bridged()) {
		return call<string | null>('clipboard', 'read')
	}

	try {
		return await navigator.clipboard.readText()
	} catch {
		return null
	}
}

export const clipboard = {
	get canCopy() {
		return bridged() || canDom
	},
	writeText,
	readText,
	// Keep the original names available for existing consumers.
	write: writeText,
	read: readText,
}
