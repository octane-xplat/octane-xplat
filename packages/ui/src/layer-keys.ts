import { configureLayerKeys, dispatchLayerKey } from './layer-stack'

// AppKit has a process-local key monitor; touch targets have no shared
// hardware Escape API. Platform back remains owned by RootLayout.
configureLayerKeys(() => {
	const native = globalThis as any
	const events = native.NSEvent
	const token = events?.addLocalMonitorForEventsMatchingMaskHandler?.(
		native.NSEventMask?.KeyDown ?? 1024,
		(event: any) => {
			if (Number(event.keyCode) !== 53) {
				return event
			}

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

export function captureLayerFocus(getTarget?: () => any): () => void {
	const owner = (globalThis as any).NSApplication?.sharedApplication?.keyWindow
	const responder = owner?.firstResponder
	return () => {
		const target = getTarget?.()
		if (target?.focus) {
			target.focus()
			return
		}

		if (target || responder) {
			owner?.makeFirstResponder?.(target ?? responder)
		}
	}
}
