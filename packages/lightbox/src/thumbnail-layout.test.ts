import { expect, it, vi } from 'vitest'
import { createThumbnailLayout, thumbnailBox } from './thumbnail-layout'

it('interpolates position and unequal dimensions at fractional paging progress', () => {
	const boxes = new Map([
		[0, { x: 0, y: 5, w: 60, h: 40 }],
		[1, { x: 70, y: 0, w: 100, h: 50 }],
	])
	expect(thumbnailBox(boxes, 0.25)).toEqual({ x: 17.5, y: 3.75, w: 70, h: 42.5 })
	expect(thumbnailBox(boxes, -0.5)).toEqual(boxes.get(0))
	expect(thumbnailBox(boxes, 1.5)).toEqual(boxes.get(1))
})

it('supports partial strips and returns no box when no thumbnails are measured', () => {
	const boxes = new Map([
		[2, { x: 0, y: 0, w: 40, h: 40 }],
		[4, { x: 80, y: 0, w: 80, h: 40 }],
	])
	expect(thumbnailBox(boxes, 3)).toEqual({ x: 40, y: 0, w: 60, h: 40 })
	expect(thumbnailBox(new Map(), 0)).toBeNull()
})

it('remeasures at current progress, preserves replacement registrations, and detaches indicators', () => {
	const a = { x: 0, y: 0, w: 40, h: 40 }
	const b = { x: 50, y: 0, w: 40, h: 40 }
	const indicator = { x: 0, y: 0, w: 0, h: 0 }
	const place = vi.fn()
	const center = vi.fn()
	const layout = createThumbnailLayout<typeof a>({ measure: (host) => host, place, center })
	const removeOld = layout.register(0, a)
	layout.register(1, b)
	const detach = layout.indicator(indicator)
	layout.place(0.5)
	expect(place).toHaveBeenLastCalledWith(indicator, { x: 25, y: 0, w: 40, h: 40 })
	b.x = 90
	layout.remeasure()
	expect(center).toHaveBeenLastCalledWith({ x: 45, y: 0, w: 40, h: 40 })
	layout.register(0, { x: 20, y: 0, w: 60, h: 40 })
	removeOld()
	layout.place(0)
	expect(center).toHaveBeenLastCalledWith({ x: 20, y: 0, w: 60, h: 40 })
	detach()
	place.mockClear()
	layout.place(1)
	expect(place).not.toHaveBeenCalled()
})
