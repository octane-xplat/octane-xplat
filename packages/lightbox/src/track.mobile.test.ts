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

describe('createInputDispatch', () => {
	const pt = { x: 0, y: 0 }
	it('routes a pan sequence to the slide latched at panStart, even if index changes', async () => {
		const { createInputDispatch } = await import('./track.mobile.tsrx')
		let index = 1
		const d = createInputDispatch(() => index)
		const seen: number[] = []
		d.inputs.set(0, () => seen.push(0))
		d.inputs.set(1, () => seen.push(1))
		d({ kind: 'panStart', at: pt, pointer: 'touch' })
		index = 2
		d({ kind: 'panMove', at: pt })
		d({ kind: 'panEnd', at: pt, velocity: { x: 0, y: 0 }, cancelled: false })
		expect(seen).toEqual([1, 1, 1])
	})
	it('taps and double taps route to the current slide', async () => {
		const { createInputDispatch } = await import('./track.mobile.tsrx')
		const d = createInputDispatch(() => 2)
		const seen: string[] = []
		d.inputs.set(2, (i: any) => seen.push(i.kind))
		d({ kind: 'tap', at: pt, pointer: 'touch' })
		d({ kind: 'doubleTap', at: pt })
		expect(seen).toEqual(['tap', 'doubleTap'])
	})
	it('unregistered slides stop receiving intents', async () => {
		const { createInputDispatch } = await import('./track.mobile.tsrx')
		const d = createInputDispatch(() => 0)
		const seen: string[] = []
		const send = (i: any) => seen.push(i.kind)
		d.inputs.set(0, send)
		d.inputs.delete(0)
		d({ kind: 'tap', at: pt, pointer: 'touch' })
		expect(seen).toEqual([])
	})
})
