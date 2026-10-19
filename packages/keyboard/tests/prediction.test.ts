import { expect, it } from 'vitest'
import { nextKeyboardPosition } from '../src/prediction'

const options = {
	current: 650,
	previous: 700,
	elapsedMs: 16,
	nextMs: 16,
	target: 500,
	top: 0,
	bottom: 800,
}

it('estimates one refresh without replacing the measured frame or crossing the destination', () => {
	expect(nextKeyboardPosition(options)).toBe(600)
	expect(nextKeyboardPosition({ ...options, current: 510 })).toBe(500)
	expect(options.current).toBe(650)
})

it('preserves the physical direction during a reversal and rejects stale timing', () => {
	expect(nextKeyboardPosition({ ...options, target: 800 })).toBe(600)
	expect(nextKeyboardPosition({ ...options, elapsedMs: 200 })).toBe(650)
	expect(nextKeyboardPosition({ ...options, nextMs: 100 })).toBe(650)
	expect(nextKeyboardPosition({ ...options, previous: NaN })).toBe(650)
})
