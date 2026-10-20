/** Focus a heading/landmark without changing scroll or permanent Tab order.
 * Blur releases the temporary attribute; owners can also release on teardown. */
export function focusBrowserTarget(target: HTMLElement): () => void {
	let temporary = !target.hasAttribute('tabindex') && target.tabIndex < 0
	const release = () => {
		target.removeEventListener('blur', release)
		if (temporary && target.getAttribute('tabindex') === '-1') {
			target.removeAttribute('tabindex')
		}
		temporary = false
	}
	if (temporary) {
		target.setAttribute('tabindex', '-1')
		target.addEventListener('blur', release, { once: true })
	}
	target.focus({ preventScroll: true })
	return release
}
