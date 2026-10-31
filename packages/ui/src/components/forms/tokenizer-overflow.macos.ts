import type { NSView } from '@octane-xplat/platform/macos'

/** Count partially or wholly clipped tokens in viewport coordinates. Null
 * means layout is not ready; never turn missing native geometry into zero. */
export function countClippedAppKitTokens(viewport: NSView | null, tokens: readonly (NSView | null)[], counter: NSView | null = null): number | null {
	if (!viewport?.window) {return null}
	const start = Number(viewport.bounds?.origin.x), width = Number(viewport.bounds?.size.width)
	const end = start + width
	if (![start, width, end].every(Number.isFinite) || width <= 0) {return null}
	let hidden = 0
	const spans: { start: number; end: number }[] = []
	for (const token of tokens) {
		if (!token || token.window !== viewport.window || typeof token.convertRectToView !== 'function' ||
			typeof token.isDescendantOf !== 'function' || !token.isDescendantOf(viewport)) {return null}
		const rect = token.convertRectToView(token.bounds, viewport)
		const x = Number(rect.origin.x), tokenWidth = Number(rect.size.width)
		if (![x, tokenWidth, x + tokenWidth].every(Number.isFinite) || tokenWidth <= 0) {return null}
		spans.push({ start: x, end: x + tokenWidth })
		// Compare both edges so RTL and a nonzero native bounds origin work.
		if (x < start - 0.5 || x + tokenWidth > end + 0.5) {hidden++}
	}
	// Reclaim the counter only when every token would fit without it. This
	// prevents a stale count from reserving its own space after a resize.
	if (hidden && counter?.window === viewport.window && typeof counter.convertRectToView === 'function') {
		const rect = counter.convertRectToView(counter.bounds, viewport)
		const x = Number(rect.origin.x), w = Number(rect.size.width)
		if ([x, w, x + w].every(Number.isFinite) && w > 0 && (x >= end - 0.5 || x + w <= start + 0.5)) {
			const expandedStart = Math.min(start, x), expandedEnd = Math.max(end, x + w)
			if (spans.every((span) => span.start >= expandedStart - 0.5 && span.end <= expandedEnd + 0.5)) {return 0}
		}
	}
	return hidden
}
