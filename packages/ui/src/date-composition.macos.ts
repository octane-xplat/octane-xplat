/** AppKit field editor owns marked text; action callbacks are committed text. */
export function hasDateComposition(
	view: any,
	event?: { isComposing?: boolean; keyCode?: number },
): boolean {
	if (event?.isComposing || event?.keyCode === 229) {
		return true
	}

	const editor =
		typeof view?.currentEditor === 'function' ? view.currentEditor() : view?.currentEditor

	return typeof editor?.hasMarkedText === 'function'
		? !!editor.hasMarkedText()
		: !!editor?.hasMarkedText
}
