import type { ScrubPhase } from './core/hit'

export interface AppKitChartPointerBridge {
	observePointerMotion?(
		view: unknown,
		handlers: { move(x: number, y: number): void; exit(): void },
	): () => void
	locatePointer?(view: unknown): { x: number; y: number } | null
}

/** Raw renderer onPan event — top-left x/y and the NSPanGestureRecognizer
 *  state (1 began / 2 changed / 3 ended / anything else cancelled). */
export interface AppKitPanEvent {
	x: number
	y: number
	deltaX: number
	deltaY: number
	state: number
}

const finite = (x: number, y: number) => Number.isFinite(x) && Number.isFinite(y)

/** Normalizes the AppKit pointer sources — pan recognizer deltas, tracking-
 *  area motion and the current mouse event — onto the shared scrub phases,
 *  mirroring the DOM listeners in Chart.web. */
export function createAppKitChartPointer(
	scrub: (phase: ScrubPhase, x: number, y: number) => void,
	size: () => { width: number; height: number },
	bridge: () => AppKitChartPointerBridge | undefined = () =>
		Reflect.get(globalThis, '__xplatAppKit'),
): {
	pan(event: { deltaX?: unknown; deltaY?: unknown; state?: unknown; x?: number; y?: number }): void
	tap(view: unknown): void
	observe(view: unknown): () => void
} {
	let panning = false
	return {
		pan(event: { deltaX?: unknown; deltaY?: unknown; state?: unknown; x?: number; y?: number }): void {
			// The AppKit driver emits a superset payload carrying x/y; the shared
			// PanGestureEvent type only declares deltaX/deltaY/state.
			const panEvent = event as AppKitPanEvent
			const state = Number(panEvent.state)
			const point = finite(panEvent.x, panEvent.y)
				? { x: panEvent.x, y: panEvent.y }
				: null
			if (state === 1) {
				if (!point) {
					return
				}

				// x/y includes the current delta — subtract it for the press start.
				panning = true
				scrub('down', point.x - Number(panEvent.deltaX ?? 0), point.y - Number(panEvent.deltaY ?? 0))
				scrub('move', point.x, point.y)
			} else if (state === 2) {
				if (panning && point) {
					scrub('move', point.x, point.y)
				}
			} else if (panning) {
				// `cancel` clears without coordinates, matching web's scrub('cancel', 0, 0).
				const ended = state === 3 ? point : null
				scrub(ended ? 'up' : 'cancel', ended?.x ?? 0, ended?.y ?? 0)
				panning = false
			}
		},
		tap(view: unknown): void {
			const point = bridge()?.locatePointer?.(view)
			if (point && finite(point.x, point.y)) {
				scrub('tap', point.x, point.y)
				return
			}

			const { width, height } = size()
			scrub('tap', width / 2, height / 2)
		},
		observe(view: unknown): () => void {
			const observePointerMotion = bridge()?.observePointerMotion
			if (!view || !observePointerMotion) {
				return () => {}
			}

			// An AppKit exit mid-drag must not reset the scrub — the pan
			// recognizer keeps delivering while pressed outside the view.
			return observePointerMotion(view, {
				move(x, y): void {
					if (!panning) {
						scrub('hover', x, y)
					}
				},
				exit(): void {
					if (!panning) {
						scrub('leave', 0, 0)
					}
				},
			})
		},
	}
}
