/** Focus a heading/landmark without changing scroll or permanent Tab order.
 * Blur releases the temporary attribute; owners can also release on teardown.
 * `focusVisible: false` marks router-driven focus — the programmatic ring
 * must not paint, so the target carries `data-xplat-programmatic-focus`
 * (engines without `FocusOptions.focusVisible` fall back to that selector)
 * for as long as the scripted focus hold lasts. */
export function focusBrowserTarget(
	target: HTMLElement,
	options: { focusVisible?: boolean } = {},
): () => void {
	const suppressRing = options.focusVisible === false
	let temporary = !target.hasAttribute('tabindex') && target.tabIndex < 0
	const release = () => {
		target.removeEventListener('blur', release)
		if (temporary && target.getAttribute('tabindex') === '-1') {
			target.removeAttribute('tabindex')
		}
		if (suppressRing) {
			target.removeAttribute('data-xplat-programmatic-focus')
		}
		temporary = false
	}
	if (temporary) {
		target.setAttribute('tabindex', '-1')
	}
	if (suppressRing) {
		target.setAttribute('data-xplat-programmatic-focus', '')
	}
	if (temporary || suppressRing) {
		target.addEventListener('blur', release, { once: true })
	}
	target.focus({ preventScroll: true, ...(suppressRing ? { focusVisible: false } : {}) })
	return release
}
