import { describe, expect, it } from 'vitest'
import { evaluateNativeMediaQuery } from './media-query-native'

const desktop = { width: 900, height: 600, coarse: false, hover: true }
const touch = { width: 390, height: 844, coarse: true, hover: false }

describe('restricted native media queries', () => {
	it('evaluates native dimensions in dips and updates at inclusive breakpoints', () => {
		expect(evaluateNativeMediaQuery('(min-width: 900px)', desktop)).toBe(true)
		expect(evaluateNativeMediaQuery('(max-width: 900px)', desktop)).toBe(true)
		expect(evaluateNativeMediaQuery('(max-width: 899px)', desktop)).toBe(false)
		expect(evaluateNativeMediaQuery('(max-width: 899px)', { ...desktop, width: 800 })).toBe(true)
		expect(evaluateNativeMediaQuery('(min-height: 800px)', touch)).toBe(true)
	})

	it('distinguishes desktop pointer/hover from mobile touch traits', () => {
		for (const query of ['(pointer: fine)', '(any-pointer: fine)', '(hover: hover)', '(any-hover: hover)']) {
			expect(evaluateNativeMediaQuery(query, desktop)).toBe(true)
			expect(evaluateNativeMediaQuery(query, touch)).toBe(false)
		}
		for (const query of ['(pointer: coarse)', '(any-pointer: coarse)', '(hover: none)', '(any-hover: none)']) {
			expect(evaluateNativeMediaQuery(query, desktop)).toBe(false)
			expect(evaluateNativeMediaQuery(query, touch)).toBe(true)
		}
	})

	it('supports orientation, negation and compound conditions', () => {
		expect(evaluateNativeMediaQuery('(orientation: landscape)', desktop)).toBe(true)
		expect(evaluateNativeMediaQuery('(orientation: portrait)', touch)).toBe(true)
		expect(evaluateNativeMediaQuery('not (pointer: coarse)', desktop)).toBe(true)
		expect(evaluateNativeMediaQuery('(min-width: 800px) and (hover: hover)', desktop)).toBe(true)
		expect(evaluateNativeMediaQuery('(pointer: coarse), (min-width: 800px)', desktop)).toBe(true)
		expect(evaluateNativeMediaQuery('(max-width: 500px) or (min-width: 800px) and (pointer: coarse)', desktop)).toBe(false)
	})

	it('does not turn unknown features or malformed values into matches', () => {
		for (const query of ['', '(pointer: banana)', '(hover: banana)', '(orientation: banana)', '(prefers-reduced-motion: reduce)', '(min-width: 8..0px)']) {
			expect(evaluateNativeMediaQuery(query, desktop)).toBe(false)
		}
	})
})
