import { clamp } from './math'
import { nativeImageIn } from './native-trigger'
import { viewRect } from './rect'

/** Reveal the source image in the nearest ancestor with an offset scrolling API.
 * ListView/RadListView index-based scrolling requires a separate adapter. */
export function scrollTriggerIntoView(trigger: any, behavior: 'smooth' | 'instant' = 'instant'): boolean {
	const target = nativeImageIn(trigger) ?? trigger
	for (let node = trigger?.parent; node; node = node.parent) {
		const horizontal = node.orientation === 'horizontal'
		const scroll = horizontal ? node.scrollToHorizontalOffset : node.scrollToVerticalOffset
		const maximum = horizontal ? node.scrollableWidth : node.scrollableHeight
		if (typeof scroll !== 'function' || !Number.isFinite(maximum)) {continue}
		const box = viewRect(node), image = viewRect(target)
		if (!box || !image) {return false}
		const start = horizontal ? image.x : image.y
		const size = horizontal ? image.w : image.h
		const edge = horizontal ? box.x : box.y
		const length = horizontal ? box.w : box.h
		const current = (horizontal ? node.horizontalOffset : node.verticalOffset) ?? 0
		// Nearest edge, including an oversized source already spanning the viewport.
		const delta = start < edge && start + size > edge + length ? 0
			: start < edge ? start - edge : start + size > edge + length ? start + size - edge - length : 0
		const offset = clamp(current + delta, 0, Math.max(0, maximum))
		if (offset !== current || behavior === 'instant') {scroll.call(node, offset, behavior === 'smooth')}
		return true
	}
	return false
}
