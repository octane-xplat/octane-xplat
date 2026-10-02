/** @jsxImportSource @octane-xplat/macos-renderer */
import { useCallback, useRef } from 'octane'
import type { PanEvent } from './props'

/** AppKit recognizer deltas normalized into the shared pan contract. */
export function usePan(callback?: (event: PanEvent) => void): ((event: any) => void) | undefined {
	const latest = useRef(callback)
	latest.current = callback
	const handler = useCallback((event: any) => {
		const states = ['cancelled', 'began', 'moved', 'ended']
		latest.current?.({
			x: event.deltaX, y: event.deltaY, dx: event.deltaX, dy: event.deltaY,
			vx: event.velocityX ?? 0, vy: event.velocityY ?? 0,
			state: states[event.state] ?? 'cancelled', target: event.view,
		})
	}, [])

	return callback ? handler : undefined
}
