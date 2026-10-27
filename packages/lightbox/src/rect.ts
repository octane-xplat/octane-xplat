// App-surface DIP rect for a native view — same getLocationOnScreen approach
// `useMeasure` uses (Phase 0 verified to 0.00002 DIP through the safe area).
import type { Rect } from './math'

function surfaceOrigin(view: any): { x: number; y: number } {
	let root = view
	while (root?.parent) {root = root.parent}
	const point = root?.getLocationOnScreen?.()
	return point ? { x: point.x, y: point.y } : { x: 0, y: 0 }
}

export function viewRect(view: any): Rect | null {
	const point = view?.getLocationOnScreen?.()
	const size = view?.getActualSize?.()
	if (!point || !size) {return null}
	const origin = surfaceOrigin(view)
	return { x: point.x - origin.x, y: point.y - origin.y, w: size.width, h: size.height }
}

export function viewInScreen(view: any): Rect | null {
	const point = view?.getLocationOnScreen?.()
	const size = view?.getActualSize?.()
	if (!point || !size) {return null}
	return { x: point.x, y: point.y, w: size.width, h: size.height }
}
