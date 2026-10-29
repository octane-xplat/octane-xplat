/** Write text to the system clipboard. Resolves false when the Clipboard API
 *  is unavailable (insecure context) or rejects. */
export async function copyText(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text)
		return true
	} catch {
		return false
	}
}
