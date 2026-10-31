import { expect, it } from 'vitest'
import { powerSearchNumber } from './power-search-number.macos'

it('accepts explicit decimal and scientific float input without treating whitespace as zero', () => {
	for (const [text, value] of [['12', 12], [' -0.5 ', -0.5], ['.5', 0.5], ['1.', 1], ['+1.5e2', 150], ['-2E-2', -0.02]] as const) {
		expect(powerSearchNumber(text, { type: 'float' })).toEqual({ value: { type: 'float', value }, error: null })
	}
})
it('rejects empty, nonfinite, partial and nondecimal values instead of saving NaN or coercing them', () => {
	for (const text of ['', ' ', 'NaN', 'Infinity', '-Infinity', '0x10', '0b10', '1_000', '1,000', '12junk', '1e999', '--1', '.']) {
		expect(powerSearchNumber(text, { type: 'float' }).value).toBeNull()
		expect(powerSearchNumber(text, { type: 'integer' }).error).toBeTruthy()
	}
})
it('requires safe whole integers but permits integral decimal/scientific representations', () => {
	for (const text of ['1.5', '-.5', '9007199254740992', '-9007199254740992']) {expect(powerSearchNumber(text, { type: 'integer' }).value).toBeNull()}
	for (const [text, value] of [['1.0', 1], ['1e3', 1000], ['9007199254740991', Number.MAX_SAFE_INTEGER], ['-9007199254740991', Number.MIN_SAFE_INTEGER]] as const) {
		expect(powerSearchNumber(text, { type: 'integer' }).value).toEqual({ type: 'integer', value })
	}
})
it('enforces inclusive zero/negative/fractional bounds without clamping user input', () => {
	for (const type of ['integer', 'float'] as const) {
		expect(powerSearchNumber('0', { type, minValue: 0, maxValue: 0 }).value?.value).toBe(0)
		expect(powerSearchNumber('-1', { type, minValue: 0 }).value).toBeNull()
		expect(powerSearchNumber('1', { type, maxValue: 0 }).value).toBeNull()
		expect(powerSearchNumber('-2', { type, minValue: -2, maxValue: -1 }).value?.value).toBe(-2)
	}
	expect(powerSearchNumber('1.5', { type: 'float', minValue: 1.5, maxValue: 1.5 }).value?.value).toBe(1.5)
})
it('rejects malformed configuration bounds rather than hiding or weakening them', () => {
	for (const bounds of [{ minValue: NaN }, { maxValue: Infinity }, { minValue: 2, maxValue: 1 }]) {
		expect(powerSearchNumber('1', { type: 'float', ...bounds }).value).toBeNull()
	}
})
