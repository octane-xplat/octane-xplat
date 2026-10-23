import { describe, expect, it, vi } from 'vitest'

const platform = vi.hoisted(() => ({ ios: true }))
vi.mock('@nativescript/core', () => ({
	get isIOS() {
		return platform.ios
	},
	Utils: {
		layout: {
			EXACTLY: 0x40000000,
			toDevicePixels: (value: number) => value * 3,
			makeMeasureSpec: (value: number, mode: number) => value | mode,
		},
	},
}))

import { prepareFullScreenPage } from './full-screen-page.mobile'

function fixture() {
	const measured: any[] = []
	const page = {
		nativeViewProtected: { bounds: { size: { width: 402, height: 874 } } },
		layoutView: { iosIgnoreSafeArea: false },
		measure(width: number, height: number) {
			measured.push({ width, height, content: this.layoutView, receiver: this })
		},
	}
	return { page, measured }
}

const exact = (dips: number) => (dips * 3) | 0x40000000

describe('prepared native Page measurement', () => {
	it('resolves percentages against the Page bounds', () => {
		const { page, measured } = fixture()
		expect(prepareFullScreenPage(page as any)).toBe(page)
		page.measure(exact(402), exact(778))
		expect(measured).toEqual([
			{ width: exact(402), height: exact(874), content: page.layoutView, receiver: page },
		])
	})

	it('uses current host bounds after resizing and replacement content', () => {
		const { page, measured } = fixture()
		prepareFullScreenPage(page as any)
		page.measure(1, 2)
		page.layoutView = { iosIgnoreSafeArea: false }
		page.nativeViewProtected.bounds.size = { width: 600, height: 320 }
		page.measure(1, 2)
		expect(measured[1].width).toBe(exact(600))
		expect(measured[1].height).toBe(exact(320))
	})

	it('does not wrap twice, and preserves incoming specs before UIKit has bounds', () => {
		const { page, measured } = fixture()
		prepareFullScreenPage(page as any)
		const measure = page.measure
		prepareFullScreenPage(page as any)
		expect(page.measure).toBe(measure)
		page.nativeViewProtected.bounds.size = { width: 0, height: 0 }
		page.measure(123, 456)
		expect(measured).toHaveLength(1)
		expect(measured[0]).toMatchObject({ width: 123, height: 456 })
	})

	it('leaves Android measurement and content inset behavior intact', () => {
		platform.ios = false
		try {
			const { page } = fixture()
			const measure = page.measure
			prepareFullScreenPage(page as any)
			expect(page.measure).toBe(measure)
			expect(page.layoutView.iosIgnoreSafeArea).toBe(false)
			expect((page as any).androidOverflowEdge).toBe('ignore')
		} finally {
			platform.ios = true
		}
	})
})
