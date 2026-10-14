import { describe, expect, it } from 'vitest'
import { meterRange } from './meter-math'

describe('meterRange', () => {
	it('clamps value into the 0..max default range', () => {
		expect(meterRange(30, 0, 100)).toEqual({ min: 0, max: 100, value: 30, ratio: 0.3 })
		expect(meterRange(150, 0, 100).value).toBe(100)
		expect(meterRange(-5, 0, 100).value).toBe(0)
	})

	it('measures the ratio across a shifted min/max range', () => {
		expect(meterRange(250, 100, 400).ratio).toBeCloseTo(0.5)
		expect(meterRange(50, 100, 400)).toMatchObject({ value: 100, ratio: 0 })
		expect(meterRange(500, 100, 400)).toMatchObject({ value: 400, ratio: 1 })
	})

	it('replaces non-finite inputs with the safe defaults', () => {
		expect(meterRange(Number.NaN, 0, 100)).toMatchObject({ value: 0, ratio: 0 })
		expect(meterRange(30, 0, Number.NaN)).toMatchObject({ max: 100, value: 30 })
	})

	it('falls back when max is not above min', () => {
		const { min, max, value } = meterRange(60, 50, 50)
		expect(min).toBe(50)
		expect(max).toBe(150)
		expect(value).toBe(60)
	})
})
