import { scrollableAreaMetrics } from './scrollable-area-metrics.macos'

/** Internal physical offsets in points from the document's left/top edges.
 * ScrollableArea converts its public logical inline offset before calling. */
export function scrollableAreaOffset(
	view: any,
	offset: { inline?: number; block?: number },
	animated = false,
): void {
	const clip = view?.contentView
	const document = view?.documentView
	const inline = Number.isFinite(offset.inline), block = Number.isFinite(offset.block)
	if (!clip || !document || (!inline && !block)) {return}
	const metrics = scrollableAreaMetrics(view)
	const clamp = (value: number, maximum: number) =>
		Math.max(0, Math.min(value, Number.isFinite(maximum) ? Math.max(0, maximum) : 0))
	const x = inline ? clamp(offset.inline!, metrics.maxX) : Number(clip.bounds.origin.x ?? 0)
	const top = block ? clamp(offset.block!, metrics.maxY) : 0
	const maximum = Number.isFinite(metrics.maxY) ? Math.max(0, metrics.maxY) : 0
	const y = block ? (document.flipped ? top : maximum - top) : Number(clip.bounds.origin.y ?? 0)
	const proxy = animated && typeof clip.animator === 'function' ? clip.animator() : null
	const target = typeof proxy?.scrollToPoint === 'function' ? proxy : clip
	target.scrollToPoint({ x, y })
	view.reflectScrolledClipView(clip)
}
