/** Read native marked/composing text without replacing the OS input delegate. */
export function hasDateComposition(
	view: any,
	event?: { isComposing?: boolean; keyCode?: number },
): boolean {
	if (event?.isComposing || event?.keyCode === 229) {
		return true
	}

	if (view?.ios?.markedTextRange) {
		return true
	}

	const editable = view?.android?.getText?.()
	const composing = (globalThis as any).android?.view?.inputmethod?.BaseInputConnection
	return !!editable && !!composing && composing.getComposingSpanStart(editable) >= 0
}
