// @vitest-environment node
import { expect, it, vi } from 'vitest'
import { scrollableAreaOffset as ios } from './scrollable-area-offset.ios'
import { scrollableAreaOffset as android } from './scrollable-area-offset.android'
import { scrollableAreaOffset as windows } from './scrollable-area-offset.windows'

it('writes Mason iOS content offsets and preserves an omitted axis', () => {
	const native = { contentOffset: { x: 12, y: 34 } }
	ios({ ios: native }, { block: 120 }, true)
	expect(native.contentOffset).toEqual({ x: 12, y: 120 })
	ios({ ios: native }, { inline: -20 })
	expect(native.contentOffset).toEqual({ x: 0, y: 120 })
	const previous = native.contentOffset
	ios({ ios: native }, { block: NaN, inline: Infinity })
	expect(native.contentOffset).toBe(previous)
	expect(() => ios(null, { block: 10 })).not.toThrow()
})

it('converts Android dips to pixels and selects the requested native operation', () => {
	const native = {
		getResources: () => ({ getDisplayMetrics: () => ({ density: 3 }) }),
		getScrollX: () => 24,
		getScrollY: () => 48,
		scrollTo: vi.fn(),
		smoothScrollTo: vi.fn(),
	}
	android({ android: native }, { block: 120 })
	expect(native.scrollTo).toHaveBeenCalledWith(24, 360)
	android({ android: native }, { inline: 4.5 }, true)
	expect(native.smoothScrollTo).toHaveBeenCalledWith(14, 48)
	android({ android: native }, { inline: -1, block: -1 })
	expect(native.scrollTo).toHaveBeenLastCalledWith(0, 0)
	android({ android: native }, { block: NaN })
	expect(native.scrollTo).toHaveBeenCalledTimes(2)
	expect(() => android(null, { block: 10 })).not.toThrow()
})

it('targets the Windows outer ScrollViewer and preserves omitted axes', () => {
	const native = { ChangeView: vi.fn(), ScrollableWidth: 300, ScrollableHeight: 400 }
	const view = { nativeViewProtected: native, windows: {} }
	windows(view, { block: 120 })
	expect(native.ChangeView).toHaveBeenCalledWith(null, 120, null, true)
	windows(view, { inline: -5 }, true)
	expect(native.ChangeView).toHaveBeenLastCalledWith(0, null, null, false)
	windows(view, { inline: Infinity })
	expect(native.ChangeView).toHaveBeenCalledTimes(2)
	windows(view, { inline: 1000, block: 2000 })
	expect(native.ChangeView).toHaveBeenLastCalledWith(300, 400, null, true)
	expect(() => windows(null, { block: 10 })).not.toThrow()
})
