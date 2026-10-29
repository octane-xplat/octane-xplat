/** Web twin — controlled text writes are DOM value assignments; the browser
 *  keeps the selection on unchanged prefixes itself. Present for
 *  platform-suffix parity; the native leaves are the only callers. */
export function writeText(view: any, value: string | undefined | null): void {
	if (!view) {
		return
	}

	const next = value ?? ''
	if (view.text !== next) {
		view.text = next
	}
}
