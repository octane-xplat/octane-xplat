import { scrollableAreaOffset } from '../layout/scrollable-area-offset.macos'
import type { NSScrollView, NSView } from '@octane-xplat/platform/macos'

/** Reveal a selected tab horizontally without moving the enclosing page. */
export function revealAppKitTab(scroll: NSScrollView | null, tab: NSView | undefined): boolean {
	const document = scroll?.documentView, clip = scroll?.contentView
	if (!document || !clip || !tab || typeof tab.convertRectToView !== 'function') return false
	if (typeof tab.isDescendantOf === 'function' && !tab.isDescendantOf(document)) return false
	const rect = tab.convertRectToView(tab.bounds, document)
	const start = Number(rect.origin.x), width = Number(rect.size.width)
	const viewport = Number(clip.bounds.size.width), current = Number(clip.bounds.origin.x)
	const maximum = Math.max(0, Number(document.frame.size.width) - viewport)
	if (![start, width, viewport, current, maximum].every(Number.isFinite) || viewport <= 0 || width < 0) return false
	// An oversized tab aligns its leading edge consistently, avoiding oscillation.
	const proposed = width > viewport || start < current ? start :
		start + width > current + viewport ? start + width - viewport : current
	const next = Math.max(0, Math.min(maximum, proposed))
	if (Math.abs(next - current) < 0.01) return false
	// Window-update observation must not restart an animator on every frame.
	scrollableAreaOffset(scroll, { inline: next })
	return true
}
