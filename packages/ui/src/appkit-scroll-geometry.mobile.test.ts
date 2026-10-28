import { expect, it, vi } from 'vitest'
import { scrollableAreaOffset } from './scrollable-area-offset.macos'
import { scrollableAreaMetrics } from './scrollable-area-metrics.macos'
import { readBounds } from './measure-bounds.macos'

function fixture(flipped: boolean) {
	const clip = {
		bounds: { origin: { x: 25, y: 0 }, size: { width: 100, height: 100 } },
		scrollToPoint: vi.fn((point: { x: number; y: number }) => { clip.bounds.origin = point }),
		animator: vi.fn(() => ({})),
	}
	const view = {
		contentView: clip,
		documentView: { frame: { size: { width: 300, height: 400 } }, flipped },
		reflectScrolledClipView: vi.fn(),
	}
	return { view, clip }
}

it('AppKit seeks and metrics agree on top-down offsets for the generated flipped property', () => {
	for (const flipped of [true, false]) {
		const { view, clip } = fixture(flipped)
		scrollableAreaOffset(view, { block: 75 }, true)
		expect(clip.scrollToPoint).toHaveBeenLastCalledWith({ x: 25, y: flipped ? 75 : 225 })
		expect(scrollableAreaMetrics(view).y).toBe(75)
		scrollableAreaOffset(view, { inline: 900 })
		expect(clip.bounds.origin.x).toBe(200)
		expect(scrollableAreaMetrics(view).y).toBe(75)
		scrollableAreaOffset(view, { block: -10 })
		expect(scrollableAreaMetrics(view).y).toBe(0)
		scrollableAreaOffset(view, { block: 900 })
		expect(scrollableAreaMetrics(view).y).toBe(300)
	}
})

it('AppKit seeks tolerate missing documents, invalid axes, short content and unavailable animator selectors', () => {
	const { view, clip } = fixture(false)
	scrollableAreaOffset(view, { block: NaN, inline: Infinity }, true)
	expect(clip.scrollToPoint).not.toHaveBeenCalled()
	expect(clip.animator).not.toHaveBeenCalled()
	view.documentView.frame.size.height = 40
	scrollableAreaOffset(view, { block: 100 }, true)
	expect(clip.scrollToPoint).toHaveBeenCalledWith({ x: 25, y: 0 })
	const animated = vi.fn()
	const host: any = view
	host.contentView.animator = () => ({ scrollToPoint: animated })
	scrollableAreaOffset(view, { inline: 20 }, true)
	expect(animated).toHaveBeenCalledWith({ x: 20, y: 0 })
	host.documentView = null
	clip.scrollToPoint.mockClear()
	scrollableAreaOffset(view, { block: 10 })
	expect(clip.scrollToPoint).not.toHaveBeenCalled()
	expect(() => scrollableAreaOffset(null, { block: 10 })).not.toThrow()
})

it('AppKit measurement uses flipped window-content coordinates and a nonzero bounds origin', () => {
	for (const flipped of [true, false]) {
		const content = { flipped, bounds: { origin: { x: 10, y: 20 }, size: { width: 400, height: 300 } } }
		const view = { window: { contentView: content }, bounds: {}, convertRectToView: vi.fn(() => ({
			origin: { x: 40, y: 80 }, size: { width: 50, height: 60 },
		})) }
		expect(readBounds(view)).toEqual({ x: 30, y: flipped ? 60 : 180, width: 50, height: 60 })
		expect(view.convertRectToView).toHaveBeenCalledWith(view.bounds, content)
	}
})
