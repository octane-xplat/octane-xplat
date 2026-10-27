import type { Box } from './types'

/**
 * Untransformed box in window DIP coordinates: each level's origin is
 * `center - bounds.size * anchorPoint` (anchorPoint is always 0.5) in the
 * superview's space. Scroll content offsets are not subtracted — subview
 * centers already live in content coordinates.
 */
export function measureNativeBox(view: any): Box | null {
	let v = view?.nativeViewProtected ?? view?.nativeView ?? view?.ios ?? null
	if (!v) return null
	const size = v.bounds.size
	let x = 0
	let y = 0
	while (v.superview) {
		x += v.center.x - v.bounds.size.width / 2
		y += v.center.y - v.bounds.size.height / 2
		v = v.superview
	}
	return { x: { min: x, max: x + size.width }, y: { min: y, max: y + size.height } }
}
