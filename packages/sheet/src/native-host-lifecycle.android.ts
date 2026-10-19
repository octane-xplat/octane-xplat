/** NativeScript observers follow the AndroidView's actual window lifetime. */
export function bindNativeHostAttachment(host: any): () => void {
	const view = host.android
	let active = true
	const loaded = () => {
		if (active && !host.isLoaded) {
			host.callLoaded()
		}
	}
	const unloaded = () => {
		if (host.isLoaded) {
			host.callUnloaded()
		}
	}
	const NativeAttachListener = (globalThis as any).android.view.View.OnAttachStateChangeListener
	const listener = new NativeAttachListener({
		onViewAttachedToWindow: loaded,
		onViewDetachedFromWindow: () => {
			if (active) {
				unloaded()
			}
		},
	})
	view.addOnAttachStateChangeListener(listener)
	if (view.isAttachedToWindow()) {
		loaded()
	} else {
		unloaded()
	}
	return () => {
		if (!active) {
			return
		}
		active = false
		view.removeOnAttachStateChangeListener(listener)
		unloaded()
	}
}
