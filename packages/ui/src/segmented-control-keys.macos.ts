/** A registered self-drawn segment. Read live state when a key arrives. */
export interface AppKitSegment {
	view: NSView
	value: string
	disabled: boolean
	select(): void
}

/** Native subview order remains authoritative after keyed child reordering. */
function orderedSegments(root: NSView, segments: Map<NSView, () => AppKitSegment>): AppKitSegment[] {
	const result: AppKitSegment[] = []
	const visit = (view: NSView) => {
		const segment = segments.get(view)?.()
		if (segment) {
			if (!segment.disabled) result.push(segment)
			return
		}

		const children = view.subviews
		for (let index = 0; index < Number(children.count); index++) {
			visit(children.objectAtIndex(index) as NSView)
		}
	}
	visit(root)
	return result
}

/** Scope navigation to a registered first responder in this control's window.
 * Enter/Space activation remains owned by the renderer's tappable host. */
export function bindSegmentedControlKeys(
	root: () => NSView | null,
	segments: Map<NSView, () => AppKitSegment>,
	direction: () => 'ltr' | 'rtl' = () => 'ltr',
): () => void {
	const host = globalThis as any
	const token = host.NSEvent?.addLocalMonitorForEventsMatchingMaskHandler?.(
		host.NSEventMask?.KeyDown ?? 1024,
		(event: any) => {
			const view = root()
			const owner = view?.window
			if (!view || !owner || event.window !== owner) return event
			if (!segments.has(owner.firstResponder as NSView)) return event
			// Preserve application shortcuts and modified navigation.
			if (Number(event.modifierFlags) & ((1 << 18) | (1 << 19) | (1 << 20))) return event
			const items = orderedSegments(view, segments)
			const current = items.findIndex((item) => item.view === owner.firstResponder)
			if (current < 0) return event
			let next: number
			const code = Number(event.keyCode)
			const horizontal = code === 123 || code === 124
			const backwards = horizontal && direction() === 'rtl' ? code === 124 : code === 123 || code === 126
			switch (code) {
				case 123: // Left
				case 126: // Up
				case 124: // Right
				case 125: // Down
					next = (current + (backwards ? items.length - 1 : 1)) % items.length
					break
				case 115: // Home
					next = 0
					break
				case 119: // End
					next = items.length - 1
					break
				default:
					return event
			}

			if (!owner.makeFirstResponder(items[next].view)) return event
			items[next].select()
			return null
		},
	)
	return () => {
		if (token) host.NSEvent.removeMonitor(token)
	}
}
