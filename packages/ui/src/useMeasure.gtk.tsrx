/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useEffect, useRef, useState } from 'octane'
import type { MeasureBounds, MeasureResult, UseMeasureOptions } from './props'

/** GTK computes bounds relative to the root's content host, without global
 * screen coordinates (which Wayland intentionally does not expose). */
function readBounds(view: any): MeasureBounds | null {
	return view?.getBounds?.() ?? null
}

/** Binds to a GTK widget and observes app-surface DIP bounds by default. */
export function useMeasure(options: UseMeasureOptions = {}): MeasureResult {
	const [bounds, setBounds] = useState<MeasureBounds | null>(null)
	const detach = useRef<(() => void) | null>(null)
	const observe = options.observe ?? true
	const ref = useCallback(
		(view: any) => {
			detach.current?.()
			detach.current = null
			if (!view) {
				setBounds(null)
				return
			}

			const update = () => {
				const next = readBounds(view)
				// Fresh object each read — skip the setState when nothing moved
				// or the re-render → layoutChanged → update loop never ends.
				setBounds((prev: MeasureBounds | null) => {
					return prev &&
						next &&
						prev.x === next.x &&
						prev.y === next.y &&
						prev.width === next.width &&
						prev.height === next.height
						? prev
						: next
				})
			}

			view.on?.('loaded', update)
			update()
			if (observe) {
				view.on?.('layoutChanged', update)
			}

			detach.current = () => {
				view.off?.('loaded', update)
				if (observe) {
					view.off?.('layoutChanged', update)
				}
			}
		},
		[observe],
	)

	useEffect(() => () => detach.current?.(), [])

	return { ref, bounds }
}
