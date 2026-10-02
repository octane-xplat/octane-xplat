import { it, expect, vi } from 'vitest'
import { measure, dragStyle } from './geometry.macos'

it('uses converted window bounds and normalizes unflipped coordinates', () => {
	const content = {
		bounds: { origin: { x: 5, y: 10 }, size: { width: 500, height: 400 } },
		isFlipped: false,
	}

	const convertRectToView = vi.fn(() => ({
		origin: { x: 25, y: 310 },
		size: { width: 100, height: 40 },
	}))

	const view = { window: { contentView: content }, bounds: {}, convertRectToView }
	const rect = measure(view)!
	expect(rect.boundingRectangle).toMatchObject({ left: 20, top: 60, width: 100, height: 40 })
	expect(convertRectToView).toHaveBeenCalledWith(view.bounds, content)
	content.isFlipped = true
	expect(measure(view)!.boundingRectangle.top).toBe(300)
})

it('ignores detached and zero-size views and exposes reversible drag styles', () => {
	expect(measure({})).toBeNull()
	expect(
		measure({
			window: { contentView: {} },
			convertRectToView: () => ({ size: { width: 0, height: 10 } }),
		}),
	).toBeNull()

	expect(dragStyle(12, 30)).toEqual({ translateX: 12, translateY: 30, zIndex: 1 })
	expect(dragStyle(0, 0)).toEqual({ translateX: 0, translateY: 0, zIndex: 0 })
})
