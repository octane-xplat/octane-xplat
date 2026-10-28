import type { Box } from './types'

/** AppKit view geometry ignores layer transforms. Return content coordinates with y pointing down. */
export function measureNativeBox(view: any): Box | null {
	if (!view?.superview) {
		return null
	}
	let x = 0
	let y = 0
	const width = view.bounds.size.width
	const height = view.bounds.size.height
	for (let current = view; current.superview; current = current.superview) {
		const parent = current.superview
		const frame = current.frame
		const flipped = typeof parent.isFlipped === 'function' ? parent.isFlipped() : parent.isFlipped
		x += frame.origin.x
		y += flipped ? frame.origin.y : parent.bounds.size.height - frame.origin.y - frame.size.height
	}
	return { x: { min: x, max: x + width }, y: { min: y, max: y + height } }
}
