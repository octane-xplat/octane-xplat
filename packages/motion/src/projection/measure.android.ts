import type { Box } from './types'

function isView(v: any): boolean {
	const View = (globalThis as any).android?.view?.View
	return View ? v instanceof View : typeof v?.getLeft === 'function'
}

/**
 * Untransformed box in window DIP coordinates: sum getLeft()/getTop() up to
 * the decor root, ignoring getScrollX/getScrollY and translations, then divide
 * by the display density. Stops before ViewRootImpl, which is not a View.
 */
export function measureNativeBox(view: any): Box | null {
	let v = view?.nativeView ?? view?.android ?? null
	if (!v) return null
	const density = v.getResources()?.getDisplayMetrics?.()?.density ?? 1
	const w = v.getWidth()
	const h = v.getHeight()
	let x = 0
	let y = 0
	while (isView(v)) {
		x += v.getLeft()
		y += v.getTop()
		v = v.getParent?.() ?? null
	}
	x /= density
	y /= density
	return { x: { min: x, max: x + w / density }, y: { min: y, max: y + h / density } }
}
