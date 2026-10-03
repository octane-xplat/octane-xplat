import { configureLayerKeys, dispatchLayerKey, setLayerComposing } from './layer-stack'

configureLayerKeys(() => {
	const start = () => setLayerComposing(true)
	const end = () => setLayerComposing(false)
	document.addEventListener('keydown', dispatchLayerKey)
	document.addEventListener('compositionstart', start, true)
	document.addEventListener('compositionend', end, true)
	document.addEventListener('blur', end, true)
	return () => {
		document.removeEventListener('keydown', dispatchLayerKey)
		document.removeEventListener('compositionstart', start, true)
		document.removeEventListener('compositionend', end, true)
		document.removeEventListener('blur', end, true)
	}
})

export function captureLayerFocus(getTarget?: () => any): () => void {
	const initial = document.activeElement as HTMLElement | null
	return () => {
		const target = getTarget?.() ?? initial
		if (
			target?.isConnected !== false &&
			typeof target?.focus === 'function' &&
			!target.closest?.('[inert]')
		) {
			target.focus({ preventScroll: true })
		}
	}
}
