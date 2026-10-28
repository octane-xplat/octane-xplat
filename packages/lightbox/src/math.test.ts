import { describe, expect, it } from 'vitest'
import { band, fit, intersect, lerpVisual, objectPosition, panRange, rubber, thumbVisualFrom, toStyle, zoomAt } from './math'

const box = { x: 0, y: 0, w: 100, h: 100 }

describe('math', () => {
	it('fit contain / cover', () => {
		expect(fit(2, box, 'contain')).toEqual({ x: 0, y: 25, w: 100, h: 50 })
		expect(fit(2, box, 'cover')).toEqual({ x: -50, y: 0, w: 200, h: 100 })
		expect(fit(0.5, box, 'cover', 0.5, 0)).toEqual({ x: 0, y: 0, w: 100, h: 200 })
	})

	it('intersect', () => {
		expect(intersect(box, { x: 50, y: 50, w: 100, h: 100 })).toEqual({ x: 50, y: 50, w: 50, h: 50 })
		expect(intersect(box, { x: 200, y: 0, w: 10, h: 10 }).w).toBe(0)
	})

	it('rubber band resists and stays under the dimension', () => {
		expect(rubber(0, 100)).toBe(0)
		expect(rubber(50, 100)).toBeLessThan(50)
		expect(rubber(50, 100)).toBeGreaterThan(0)
		expect(rubber(1e6, 100)).toBeLessThan(100)
		expect(rubber(-50, 100)).toBe(-rubber(50, 100))
		expect(band(5, 0, 10, 100)).toBe(5)
		expect(band(20, 0, 10, 100)).toBeLessThan(20)
	})

	it('pan range centres small content and bounds large content', () => {
		expect(panRange(10, 80, 1, 100)).toEqual([0, 0])
		expect(panRange(0, 100, 2, 100)).toEqual([-100, -0])
		expect(panRange(20, 50, 1, 100)).toEqual([0, 0])
		expect(panRange(20, 20, 2, 100)).toEqual([-10, -10])
		expect(panRange(40, 50, 1.6, 100)).toEqual([-20, -20])
	})

	it('zoomAt keeps the focus point fixed', () => {
		const t1 = zoomAt(10, 0, 1, 3, 40)
		expect((40 - 10) / 1).toBeCloseTo((40 - (10 + t1)) / 3)
	})

	it('toStyle maps a cover-cropped thumbnail onto the laid-out image', () => {
		const base = { x: 0, y: 0, w: 200, h: 100 }
		// thumbnail: 50x50 square showing the centre of a 2:1 image → image drawn 100x50, centred on the square
		const thumb = {
			img: { x: 75, y: 50, w: 100, h: 50 },
			clip: { x: 100, y: 50, w: 50, h: 50 },
			radius: 10,
			opacity: 1,
		}
		const s = toStyle(thumb, base)
		expect(s.scale).toBe(0.5)
		expect(s.x).toBe(75)
		expect(s.inset).toEqual({ top: 0, right: 50, bottom: 0, left: 50 })
		expect(s.radius).toBe(20)
		const end = toStyle(lerpVisual(thumb, { img: base, clip: base, radius: 0, opacity: 1 }, 1), base)
		expect(end).toEqual({ x: 0, y: 0, scale: 1, inset: { top: 0, right: 0, bottom: 0, left: 0 }, radius: 0, opacity: 1 })
	})

	it('objectPosition', () => {
		expect(objectPosition('50% 0%')).toEqual([0.5, 0])
		expect(objectPosition('10px 100%')).toEqual([0.5, 1])
	})
})

	describe('zero-box safety', () => {
		it('toStyle emits no NaN with a zero-size base', () => {
			const v: Visual = { img: { x: 0, y: 0, w: 0, h: 0 }, clip: { x: 0, y: 0, w: 0, h: 0 }, radius: 0, opacity: 1 }
			const s = toStyle(v, { x: 0, y: 0, w: 0, h: 0 })
			for (const n of [s.x, s.y, s.scale, s.opacity, s.radius, s.inset.top, s.inset.right, s.inset.bottom, s.inset.left]) {
				expect(Number.isFinite(n)).toBe(true)
			}
		})
		it('fit returns finite values with a zero-size box', () => {
			const f = fit(1.333, { x: 0, y: 0, w: 0, h: 0 })
			for (const n of [f.x, f.y, f.w, f.h]) {expect(Number.isFinite(n)).toBe(true)}
		})
	})

describe('thumbVisualFrom', () => {
	it('cover-fits the image into the trigger rect in slide-local space', () => {
		const v = thumbVisualFrom({ x: 10, y: 20, w: 120, h: 80 }, { x: 0, y: 0, w: 402, h: 874 }, 4 / 3)
		expect(v.img).toEqual({ x: 10, y: 15, w: 120, h: 90 })
		expect(v.clip).toEqual({ x: 10, y: 20, w: 120, h: 80 })
		expect(v.opacity).toBe(1)
	})
	it('subtracts the slide offset', () => {
		const v = thumbVisualFrom({ x: 110, y: 120, w: 120, h: 80 }, { x: 100, y: 100, w: 402, h: 874 }, 4 / 3)
		expect(v.clip).toEqual({ x: 10, y: 20, w: 120, h: 80 })
		expect(v.img.x).toBe(10)
	})
	it('clamps radius to half the clip shorter side', () => {
		const v = thumbVisualFrom({ x: 0, y: 0, w: 120, h: 80 }, { x: 0, y: 0, w: 402, h: 874 }, 1, 60)
		expect(v.radius).toBe(40)
	})
})
