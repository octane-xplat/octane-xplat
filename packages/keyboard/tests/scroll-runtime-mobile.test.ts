import { expect, it, vi } from 'vitest'
vi.mock('@nativescript/core', () => ({
	Utils: {
		layout: {
			toDeviceIndependentPixels: (value: number) => value,
			toDevicePixels: (value: number) => value,
		},
	},
}))
import { scrollRuntime } from '../src/scroll-runtime.mobile'

it('writes a MasonKit scroller through mason_scrollTo', () => {
	const owner: any = {
		mason_scrollTop: 0,
		mason_scrollTo: vi.fn(function (this: any, _x: number, y: number) {
			this.mason_scrollTop = y
		}),
	}
	expect(scrollRuntime.read(owner)).toBe(0)
	scrollRuntime.write(owner, 300)
	expect(owner.mason_scrollTo).toHaveBeenCalledWith(NaN, 300, false)
	expect(scrollRuntime.read(owner)).toBe(300)
})

it('keeps the UIScrollView path first', () => {
	const owner: any = {
		contentOffset: { x: 0, y: 40 },
		contentSize: { width: 400, height: 2000 },
		bounds: { size: { width: 400, height: 800 } },
		adjustedContentInset: { top: 0, bottom: 0 },
		setContentOffsetAnimated: vi.fn(),
	}
	expect(scrollRuntime.read(owner)).toBe(40)
	scrollRuntime.write(owner, 300)
	expect(owner.setContentOffsetAnimated).toHaveBeenCalledWith({ x: 0, y: 300 }, false)
})
