/** Selection helpers for the web contenteditable composer — ported from
 *  Astryx chatComposerSelection. A programmatic focus() collapses the caret
 *  to the start (Chromium) or leaves no Range at all, so the composer never
 *  infers the caret from a bare focus: placeCaretAtEnd for click-to-focus,
 *  getSelectionRangeInside/restoreSelectionRange to keep a user's own
 *  selection, ensureCaretInside when any valid Range suffices. */

export function getSelectionRangeInside(editable: HTMLElement): Range | null {
	const selection = window.getSelection()
	if (!selection || selection.rangeCount === 0) {
		return null
	}

	const range = selection.getRangeAt(0)
	if (!editable.contains(range.startContainer) || !editable.contains(range.endContainer)) {
		return null
	}

	return range.cloneRange()
}

export function restoreSelectionRange(range: Range): void {
	const selection = window.getSelection()
	if (!selection) {
		return
	}

	selection.removeAllRanges()
	selection.addRange(range)
}

export function placeCaretAtEnd(editable: HTMLElement): boolean {
	const selection = window.getSelection()
	if (!selection) {
		return false
	}

	const range = document.createRange()
	range.selectNodeContents(editable)
	range.collapse(false)
	selection.removeAllRanges()
	selection.addRange(range)
	return true
}

export function ensureCaretInside(editable: HTMLElement): Selection | null {
	const selection = window.getSelection()
	if (!selection) {
		return null
	}

	if (selection.rangeCount > 0) {
		const existing = selection.getRangeAt(0)
		if (editable.contains(existing.startContainer)) {
			return selection
		}
	}

	const range = document.createRange()
	range.selectNodeContents(editable)
	range.collapse(false)
	selection.removeAllRanges()
	selection.addRange(range)
	return selection
}

export function isSelectionAtStart(editable: HTMLElement): boolean {
	const selection = window.getSelection()
	if (!selection || selection.rangeCount === 0) {
		return false
	}

	const range = selection.getRangeAt(0)
	return isBoundaryAtEdge(editable, range.startContainer, range.startOffset, 'start')
}

export function isSelectionAtEnd(editable: HTMLElement): boolean {
	const selection = window.getSelection()
	if (!selection || selection.rangeCount === 0) {
		return false
	}

	const range = selection.getRangeAt(0)
	return isBoundaryAtEdge(editable, range.endContainer, range.endOffset, 'end')
}

function isBoundaryAtEdge(
	editable: HTMLElement,
	container: Node,
	offset: number,
	edge: 'start' | 'end',
): boolean {
	if (!editable.contains(container) || !isAtNodeEdge(container, offset, edge)) {
		return false
	}

	for (let node: Node | null = container; node && node !== editable;) {
		if (hasContentSibling(node, edge)) {
			return false
		}

		node = node.parentNode
	}

	return true
}

function isAtNodeEdge(node: Node, offset: number, edge: 'start' | 'end'): boolean {
	if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE) {
		return edge === 'start' ? offset === 0 : offset === (node.nodeValue?.length ?? 0)
	}

	return edge === 'start' ? offset === 0 : offset === node.childNodes.length
}

function hasContentSibling(node: Node, edge: 'start' | 'end'): boolean {
	for (
		let sibling = edge === 'start' ? node.previousSibling : node.nextSibling;
		sibling;
		sibling = edge === 'start' ? sibling.previousSibling : sibling.nextSibling
	) {
		if (
			sibling.nodeType === Node.ELEMENT_NODE ||
			(sibling.nodeType === Node.TEXT_NODE && sibling.nodeValue !== '')
		) {
			return true
		}
	}

	return false
}

export function insertTextAtCursor(editable: HTMLElement, text: string): boolean {
	const selection = ensureCaretInside(editable)
	if (!selection || selection.rangeCount === 0) {
		return false
	}

	const range = selection.getRangeAt(0)
	range.deleteContents()
	const textNode = document.createTextNode(text)
	range.insertNode(textNode)
	range.setStartAfter(textNode)
	range.collapse(true)
	selection.removeAllRanges()
	selection.addRange(range)
	return true
}
