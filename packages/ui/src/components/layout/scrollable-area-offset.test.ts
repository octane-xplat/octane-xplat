// @vitest-environment node
import { expect, it, vi } from 'vitest'
import { scrollableAreaOffset as ios } from './scrollable-area-offset.ios'
import { scrollableAreaOffset as android } from './scrollable-area-offset.android'
import { scrollableAreaOffset as windows } from './scrollable-area-offset.windows'

const variants = { ios, android, windows }

for (const [name, scrollableAreaOffset] of Object.entries(variants)) {
	it(`${name}: seeks through the Mason scrollTo surface`, () => {
		const view = { scrollTo: vi.fn() }
		scrollableAreaOffset(view, { block: 120 }, true)
		expect(view.scrollTo).toHaveBeenCalledWith({ top: 120, behavior: 'smooth' })
		scrollableAreaOffset(view, { inline: -20 })
		expect(view.scrollTo).toHaveBeenCalledWith({ left: 0, behavior: 'instant' })
		scrollableAreaOffset(view, { block: NaN, inline: Infinity })
		expect(view.scrollTo).toHaveBeenCalledTimes(2)
		expect(() => scrollableAreaOffset(null, { block: 10 })).not.toThrow()
	})
}
