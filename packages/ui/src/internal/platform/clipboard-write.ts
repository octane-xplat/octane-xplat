// Native clipboard write — @nativescript/core's Utils.copyToClipboard covers
// iOS and Android. Kept behind a leaf so the web variant can use
// navigator.clipboard. Async to match the web signature.
import { Utils } from '@nativescript/core'

/** Write text to the system clipboard. Resolves false on failure. */
export async function copyText(text: string): Promise<boolean> {
	try {
		Utils.copyToClipboard(text)
		return true
	} catch {
		return false
	}
}
