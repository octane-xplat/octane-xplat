import type { Point } from './types'

/** Keep ancestor identities so an unmount snapshot can still read current scroll. */
export function captureViewportOffset(node: HTMLElement): () => Point {
	const ancestors: HTMLElement[] = []
	let fixed = getComputedStyle(node).position === 'fixed'
	for (let parent = node.parentElement; parent && !fixed; parent = parent.parentElement) {
		if (parent !== document.scrollingElement) {
			ancestors.push(parent)
		}

		fixed = getComputedStyle(parent).position === 'fixed'
	}
	return () => ({
		x:
			-(fixed ? 0 : window.scrollX) - ancestors.reduce((sum, parent) => sum + parent.scrollLeft, 0),
		y: -(fixed ? 0 : window.scrollY) - ancestors.reduce((sum, parent) => sum + parent.scrollTop, 0),
	})
}
