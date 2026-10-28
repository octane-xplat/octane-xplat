import type { Point } from './types'

export function captureViewportOffset(view: any): () => Point {
	const ancestors: any[] = []
	for (let parent = view?.superview; parent; parent = parent.superview) {
		ancestors.push(parent)
	}
	return () => ({
		x: -ancestors.reduce((sum, parent) => sum + (parent.bounds.origin?.x ?? 0), 0),
		y: ancestors.reduce((sum, parent) => {
			const flipped = typeof parent.isFlipped === 'function' ? parent.isFlipped() : parent.isFlipped
			return sum + (flipped ? -1 : 1) * (parent.bounds.origin?.y ?? 0)
		}, 0),
	})
}
