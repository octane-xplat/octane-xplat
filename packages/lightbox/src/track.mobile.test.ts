import { describe, expect, it } from 'vitest'

// Pure track-math coverage — the controller's snap/progress logic exercised
// without the NS renderer (object-driver coverage of the rendered component
// lives in the iOS probe).
describe('native track math', () => {
	it('progress = -x / stride', async () => {
		const { clamp } = await import('./math')
		const stride = 402
		const progress = (x: number) => -x / stride
		expect(progress(-402)).toBe(1)
		expect(progress(-200)).toBeCloseTo(0.5)
		expect(clamp(Math.round(200 / stride), 0, 2)).toBe(0)
	})
	it('snap projection: x + 0.2*vx decides the landing slide', async () => {
		const { clamp } = await import('./math')
		const stride = 402
		const snap = (x: number, vx: number) => clamp(Math.round(-(x + 0.2 * vx) / stride), 0, 2)
		expect(snap(-200, -900)).toBe(1)
		expect(snap(-60, 0)).toBe(0)
		expect(snap(-700, 0)).toBe(2)
	})
})
