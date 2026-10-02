/** @jsxImportSource @octane-xplat/macos-renderer */
import { useCallback, useEffect, useRef, useState } from 'octane'
import type { MeasureBounds, MeasureResult, UseMeasureOptions } from './props'
import { readBounds } from './measure-bounds.macos'

/** Observe window-relative layout and ancestor scrolling; release all observers on rebind/unmount. */
export function useMeasure(options: UseMeasureOptions = {}): MeasureResult {
	const [bounds, setBounds] = useState<MeasureBounds | null>(null)
	const detach = useRef<(() => void) | null>(null)
	const observe = options.observe ?? true
	const bind = useCallback((view: any) => {
		detach.current?.()
		detach.current = null
		const update = () => {
			const next = readBounds(view)
			setBounds((previous: MeasureBounds | null) => previous && next &&
				previous.x === next.x && previous.y === next.y && previous.width === next.width && previous.height === next.height
				? previous : next)
		}

		update()
		if (!view || !observe) return
		const appKit = globalThis as any
		const center = appKit.NSNotificationCenter.defaultCenter
		const observers: any[] = []
		let ancestor = view
		while (ancestor) {
			ancestor.postsFrameChangedNotifications = true
			ancestor.postsBoundsChangedNotifications = true
			for (const name of [appKit.NSViewFrameDidChangeNotification, appKit.NSViewBoundsDidChangeNotification]) {
				observers.push(center.addObserverForNameObjectQueueUsingBlock(name, ancestor, null, update))
			}

			ancestor = ancestor.superview
		}

		detach.current = () => { for (const observer of observers) center.removeObserver(observer) }
	}, [observe])

	useEffect(() => () => detach.current?.(), [])
	return { bind, bounds }
}
