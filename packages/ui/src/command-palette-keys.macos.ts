/** Scope AppKit key monitoring to the palette field's editor and owning window. */
export function bindCommandPaletteKeys(
	input: any,
	keyDown: (event: any) => void,
	autoFocus: boolean,
	queryChanged: (query: string) => void,
): () => void {
	const native = globalThis as any
	const owner = input.window
	const previous = owner?.firstResponder
	if (autoFocus) {
		owner?.makeFirstResponder?.(input)
	}

	const editorOf = () =>
		typeof input.currentEditor === 'function' ? input.currentEditor() : input.currentEditor

	const keys: Record<number, string> = {
		36: 'Enter',
		76: 'Enter',
		53: 'Escape',
		125: 'ArrowDown',
		126: 'ArrowUp',
		116: 'PageUp',
		121: 'PageDown',
	}

	const notifications = native.NSNotificationCenter?.defaultCenter
	const observer = notifications?.addObserverForNameObjectQueueUsingBlock?.(
		'NSControlTextDidChangeNotification',
		input,
		null,
		() => queryChanged(String(input.stringValue ?? '')),
	)

	const token = native.NSEvent?.addLocalMonitorForEventsMatchingMaskHandler?.(
		native.NSEventMask?.KeyDown ?? 1024,
		(event: any) => {
			if (event.window !== owner || owner?.firstResponder !== editorOf()) {
				return event
			}

			const editor = editorOf()
			const marked =
				typeof editor?.hasMarkedText === 'function' ? editor.hasMarkedText() : editor?.hasMarkedText

			if (marked) {
				return event
			}

			const key = keys[Number(event.keyCode)]
			if (!key) {
				return event
			}

			let prevented = false
			keyDown({
				key,
				preventDefault: () => {
					prevented = true
				},
			})

			return prevented ? null : event
		},
	)

	return () => {
		if (token) {
			native.NSEvent.removeMonitor(token)
		}

		if (observer) {
			notifications.removeObserver(observer)
		}

		if (owner?.firstResponder === editorOf()) {
			owner?.makeFirstResponder?.(previous ?? null)
		}
	}
}
