import { appKitHost, hostGlobal } from './host-bridge'
/** Write text to the macOS pasteboard via the __xplatAppKit bridge
 *  (NSPasteboard). Resolves false when the bridge is absent. */
export async function copyText(text: string): Promise<boolean> {
	try {
		return Boolean(appKitHost()?.writeClipboard?.(text))
	} catch {
		return false
	}
}
