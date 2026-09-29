export function blockInput(node: HTMLElement): () => void {
	const inert = node.hasAttribute('inert')
	const hidden = node.getAttribute('aria-hidden')
	const pointerEvents = node.style.pointerEvents
	const focused = node.ownerDocument.activeElement as HTMLElement | null
	if (focused && node.contains(focused)) {focused.blur()}
	node.setAttribute('inert', '')
	node.setAttribute('aria-hidden', 'true')
	node.style.pointerEvents = 'none'
	return () => {
		if (!inert) {node.removeAttribute('inert')}
		if (hidden === null) {node.removeAttribute('aria-hidden')}
		else {node.setAttribute('aria-hidden', hidden)}

		node.style.pointerEvents = pointerEvents
	}
}
