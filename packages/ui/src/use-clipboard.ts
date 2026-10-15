import { copyText } from './clipboard-write'

/** Text-only copy trigger. Unlike React Aria's rich clipboard hook, this
 * attaches to a shared Pressable through onPress; it does not handle paste. */
export interface UseClipboardOptions {
	/** Produce the text to copy on each activation. */
	getItems: () => string
	/** Called after each attempt; false includes unavailable/denied writes
	 * and a throwing getItems producer. */
	onCopy?: (success: boolean) => void
}

export interface UseClipboardResult {
	/** Copy text and notify onCopy before resolving the copyText boolean result. */
	copy(): Promise<boolean>
	clipboardProps: {
		onPress: () => Promise<boolean>
	}
}

export function useClipboard(options: UseClipboardOptions): UseClipboardResult {
	const copy = async () => {
		let success = false
		try {
			success = await copyText(options.getItems())
		} catch {
			// The text producer can fail before the platform write starts.
		}

		options.onCopy?.(success)
		return success
	}

	return { copy, clipboardProps: { onPress: copy } }
}
