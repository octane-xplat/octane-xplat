import { copyText } from './clipboard-write'

/** React Aria's useClipboard: returned clipboardProps spread onto a
 *  trigger; onPress copies the getItems payload through the platform
 *  clipboard write (navigator.clipboard / UIPasteboard / NSPasteboard).
 *  Text payloads only — RA's rich ClipboardItem surface isn't ported. */
export interface UseClipboardOptions {
	/** Produce the text to copy on each press. */
	getItems: () => string
}

export interface UseClipboardResult {
	clipboardProps: {
		onPress: () => void
	}
}

export function useClipboard(options: UseClipboardOptions): UseClipboardResult {
	return {
		clipboardProps: {
			onPress: () => {
				void copyText(options.getItems())
			},
		},
	}
}
