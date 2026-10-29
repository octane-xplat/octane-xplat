const nativeView = (host: any) => host?.nativeViewProtected ?? host?.ios ?? host
const firstResponder = (view: any): any => {
	if (
		typeof view?.isFirstResponder === 'function' ? view.isFirstResponder() : view?.isFirstResponder
	) {
		return view
	}
	const children = view?.subviews
	for (let index = 0; index < (children?.count ?? children?.length ?? 0); index++) {
		const found = firstResponder(
			children.objectAtIndex ? children.objectAtIndex(index) : children[index],
		)

		if (found) {
			return found
		}
	}
	return null
}

/** Capture only the declaring host's UIWindow. No delegates or text are read. */
export function captureLayerFocus(getTarget?: () => any, host?: any): () => void {
	const owner =
		nativeView(host)?.window ??
		nativeView(getTarget?.())?.window ??
		(host ? undefined : (globalThis as any).UIApplication?.sharedApplication?.keyWindow)
	const initial = firstResponder(owner)
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
		if (responder && owner && responder.window === owner && owner?.isKeyWindow !== false) {
			responder.becomeFirstResponder?.()
		}
	}
}
