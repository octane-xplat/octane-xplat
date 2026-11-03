import { expect, it } from 'vitest'
import { isPercentSize, isPixelSize, percent, pixel, toPixels } from './resize-math'

it('accepts constructor output for pixel and percent sizes', () => {
	expect(isPixelSize(pixel(240))).toBe(true)
	expect(isPercentSize(percent(50, { min: pixel(200) }))).toBe(true)
	expect(isPercentSize(percent(50, { max: pixel(200) }))).toBe(true)
})

it('rejects a pixel shape missing its numeric value', () => {
	expect(isPixelSize({ type: 'pixel' })).toBe(false)
	expect(isPixelSize({ type: 'pixel', value: '240' })).toBe(false)
	expect(isPixelSize({ value: 240 })).toBe(false)
	expect(isPixelSize(null)).toBe(false)
	expect(isPixelSize('pixel')).toBe(false)
})

it('rejects percent shapes with absent, doubled, or malformed bounds', () => {
	expect(isPercentSize({ type: 'percent' })).toBe(false)
	expect(isPercentSize({ type: 'percent', value: 50 })).toBe(false)
	expect(isPercentSize({ type: 'percent', value: '50', min: pixel(200) })).toBe(false)
	expect(isPercentSize({ type: 'percent', value: 50, min: pixel(10), max: pixel(20) })).toBe(false)
	expect(isPercentSize({ type: 'percent', value: 50, min: { type: 'pixel' } })).toBe(false)
	expect(isPercentSize({ type: 'percent', value: 50, min: { type: 'other', value: 1 } })).toBe(
		false,
	)
	expect(isPercentSize({ type: 'percent', value: 50, max: null })).toBe(false)
})

it('still resolves valid sizes through toPixels', () => {
	expect(toPixels(pixel(240), 1000)).toBe(240)
	expect(toPixels(percent(50, { min: pixel(600) }), 1000)).toBe(600)
	expect(toPixels(percent(50, { max: pixel(400) }), 1000)).toBe(400)
	expect(toPixels({ type: 'percent', value: 50 } as unknown as never, 1000)).toBe(null)
})
