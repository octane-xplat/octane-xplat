import { expect, it, vi } from 'vitest'
import { scrollTriggerIntoView } from './scroll-sync'
import { nativeVisibleFraction, pickNativeTrigger } from './native-trigger'
function box(x: number, y: number, w: number, h: number, parent?: any) {
	return { parent, getActualSize: () => ({ width: w, height: h }), getLocationOnScreen: () => ({ x, y }) }
}
it.each(['vertical', 'horizontal'])('reveals offscreen sources on the %s axis and clamps offsets', orientation => {
	const root = box(0, 0, 400, 800)
	const scroll = Object.assign(box(0, 0, 200, 200, root), {
		orientation, verticalOffset: 100, horizontalOffset: 100, scrollableWidth: 500, scrollableHeight: 500,
		scrollToVerticalOffset: vi.fn(), scrollToHorizontalOffset: vi.fn(),
	})
	const source = orientation === 'vertical' ? box(20, 250, 50, 50, scroll) : box(250, 20, 50, 50, scroll)
	expect(scrollTriggerIntoView(source, 'smooth')).toBe(true)
	const method = orientation === 'vertical' ? scroll.scrollToVerticalOffset : scroll.scrollToHorizontalOffset
	expect(method).toHaveBeenLastCalledWith(200, true)
	const before = box(-150, -150, 50, 50, scroll)
	scrollTriggerIntoView(before, 'instant')
	expect(method).toHaveBeenLastCalledWith(0, false)
	const far = box(2000, 2000, 50, 50, scroll)
	scrollTriggerIntoView(far, 'instant')
	expect(method).toHaveBeenLastCalledWith(500, false)
})
it('does not invent an offset API for index-based lists', () => {
	const root = box(0, 0, 400, 800)
	const list = Object.assign(box(0, 0, 200, 200, root), { typeName: 'ListView', scrollToIndex: vi.fn() })
	expect(scrollTriggerIntoView(box(0, 300, 50, 50, list))).toBe(false)
	expect(list.scrollToIndex).not.toHaveBeenCalled()
})
it('chooses visible duplicates, preserves an attached opener, and ignores detached registrations', () => {
	const root = box(0, 0, 400, 800)
	const clip = Object.assign(box(0, 0, 200, 200, root), { typeName: 'ScrollView' })
	const offscreen = box(0, 300, 50, 50, clip), visible = box(0, 50, 50, 50, clip)
	const detached = box(0, 0, 50, 50)
	expect(nativeVisibleFraction(offscreen)).toBe(0)
	expect(pickNativeTrigger([detached, offscreen, visible], null)).toBe(visible)
	expect(pickNativeTrigger([offscreen, visible], offscreen)).toBe(offscreen)
	expect(pickNativeTrigger([detached], null)).toBeNull()
})
