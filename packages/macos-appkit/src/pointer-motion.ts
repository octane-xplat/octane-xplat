export interface PointerMotionHandlers {
	move(x: number, y: number): void
	exit(): void
}

/** Top-left logical point in `view` for a window-space point; null if unavailable. */
export function viewPoint(
	view: any,
	windowPoint: { x: number; y: number } | null | undefined,
): { x: number; y: number } | null {
	if (!view || !windowPoint || typeof view.convertPointFromView !== 'function') {
		return null
	}

	const point = view.convertPointFromView(windowPoint, null)
	const bounds = view.bounds
	if (!point || !bounds) {
		return null
	}

	const x = Number(point.x) - Number(bounds.origin?.x ?? 0)
	const y = view.flipped
		? Number(point.y) - Number(bounds.origin?.y ?? 0)
		: Number(bounds.origin?.y ?? 0) + Number(bounds.size?.height ?? 0) - Number(point.y)
	return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null
}

/** Per-view NSTrackingArea mouse-move/exit leases for pointer scrubbing —
 *  kept out of hoverRecordsByArea, whose records own cursors and tooltips
 *  and allow only one area per view. Dispatch reaches these records through
 *  the shared hover target's mouseEntered/mouseMoved/mouseExited. */
export function createAppKitPointerMotion(native: () => Record<string, any> = () => globalThis) {
	const records = new Map<object, { view: any; handlers: PointerMotionHandlers }>()
	const MOUSE_TYPES = new Set([1, 2, 3, 4, 25, 26])

	const trackingOpt = (value: number | undefined, fallback: number) =>
		typeof value === 'number' && Number.isFinite(value) ? value : fallback
	const options = () => {
		const flags = (native().NSTrackingAreaOptions ?? {}) as Record<string, number>
		return (
			trackingOpt(flags.MouseEnteredAndExited, 0x01) |
			trackingOpt(flags.MouseMoved, 0x02) |
			trackingOpt(flags.ActiveAlways, 0x80) |
			trackingOpt(flags.InVisibleRect, 0x200)
		)
	}

	return {
		available(target: unknown): boolean {
			return Boolean(target) && typeof native().NSTrackingArea?.alloc === 'function'
		},

		observe(view: any, handlers: PointerMotionHandlers, target: unknown): () => void {
			const events = native()
			if (
				!view ||
				!handlers ||
				typeof view.addTrackingArea !== 'function' ||
				typeof events.NSTrackingArea?.alloc !== 'function' ||
				!target
			) {
				return () => {}
			}

			const area = events.NSTrackingArea.alloc().initWithRectOptionsOwnerUserInfo(
				{ origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
				options(),
				target,
				null,
			)
			if (!area) {
				return () => {}
			}

			view.addTrackingArea(area)
			records.set(area, { view, handlers })
			let active = true
			return () => {
				if (!active) {
					return
				}

				active = false
				records.delete(area)
				try {
					view.removeTrackingArea(area)
				} catch (error) {
					console.error('[macos-pointer] failed to remove tracking area', error)
				}
			}
		},

		dispatch(area: unknown, phase: 'enter' | 'move' | 'exit', event: any): boolean {
			const record = records.get(area as object)
			if (!record) {
				return false
			}

			try {
				if (phase === 'exit') {
					record.handlers.exit()
				} else {
					const point = viewPoint(record.view, event?.locationInWindow)
					if (point) {
						record.handlers.move(point.x, point.y)
					}
				}
			} catch (error) {
				console.error('[macos-pointer] handler failed', error)
			}

			return true
		},

		/** The current mouse event's point in `view` — valid only while the app
		 *  is dispatching that event (e.g. inside a tap recognizer callback). */
		locate(view: any): { x: number; y: number } | null {
			const event = native().NSApplication?.sharedApplication?.currentEvent
			if (
				!view ||
				!event ||
				!MOUSE_TYPES.has(Number(event.type)) ||
				event.window !== view.window
			) {
				return null
			}

			return viewPoint(view, event.locationInWindow)
		},
	}
}
