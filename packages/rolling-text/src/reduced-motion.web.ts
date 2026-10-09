export function readReducedMotion(): boolean {
	return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function observeReducedMotion(notify: () => void): () => void {
	if (typeof matchMedia !== 'function') {
		return () => {}
	}

	const media = matchMedia('(prefers-reduced-motion: reduce)')
	media.addEventListener('change', notify)
	return () => media.removeEventListener('change', notify)
}
