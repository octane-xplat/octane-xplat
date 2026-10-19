import { Application } from '@nativescript/core'

const nativeView = (host: any) => host?.nativeViewProtected ?? host?.android ?? host

/** Capture the declaring decor's focus; a detached or inactive owner cannot steal it. */
export function captureLayerFocus(getTarget?: () => any, host?: any): () => void {
	const owner =
		nativeView(host)?.getRootView?.() ??
		nativeView(getTarget?.())?.getRootView?.() ??
		(host ? undefined : Application.android?.foregroundActivity?.getWindow()?.getDecorView())
	const initial = owner?.findFocus?.()
	return () => {
		const target = getTarget?.()
		if (target?.isLoaded === false) {
			return
		}
		if (typeof target?.focus === 'function') {
			target.focus()
			return
		}
		const responder = nativeView(target) ?? initial
		if (
			responder &&
			owner &&
			responder.getRootView?.() === owner &&
			responder?.isAttachedToWindow?.() !== false &&
			owner?.hasWindowFocus?.() !== false
		) {
			responder.requestFocus?.()
		}
	}
}
