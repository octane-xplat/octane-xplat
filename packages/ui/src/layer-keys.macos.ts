import { configureLayerKeys, dispatchLayerKey } from './layer-stack'
import { captureAppKitLayerFocus } from './layer-focus.macos'
import { appKitHost } from './host-bridge'

// AppKit has a process-local key monitor; touch targets have no shared
// hardware Escape API. Platform back remains owned by RootLayout.
configureLayerKeys(() => {
	const native = globalThis as Record<string, any>
	const events = native.NSEvent
	const token = events?.addLocalMonitorForEventsMatchingMaskHandler?.(
		native.NSEventMask?.KeyDown ?? 1024,
		(event: any) => {
			if (Number(event.keyCode) !== 53) {
				return event
			}

			// Local monitors have no guaranteed order. Give the renderer the same
			// native event first; its dispatcher deduplicates a later monitor call.
			const handled = appKitHost()?.dispatchKeyboardEvent?.(event)
			if (handled?.defaultPrevented) return null
			if (handled?.propagationStopped) return event

			const responder = event.window?.firstResponder
			const marked =
				typeof responder?.hasMarkedText === 'function'
					? responder.hasMarkedText()
					: responder?.hasMarkedText

			let prevented = false
			dispatchLayerKey({
				key: 'Escape',
				isComposing: !!marked,
				preventDefault: () => {
					prevented = true
				},
			})

			return prevented ? null : event
		},
	)

	return () => {
		if (token) {
			events.removeMonitor(token)
		}
	}
})


export function captureLayerFocus(getTarget?: () => any, host?: any): () => void {
	return captureAppKitLayerFocus(getTarget, host)
}
