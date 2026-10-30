import type { FilterValueFloat, FilterValueInteger, FloatOperatorValue, IntegerOperatorValue } from '../../props'

/** Explicit decimal/scientific input; Number('') and Number('0x10') are not edits. */
export function powerSearchNumber(text: string, operator: IntegerOperatorValue | FloatOperatorValue): {
	value: FilterValueInteger | FilterValueFloat | null; error: string | null
} {
	if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text.trim())) {
		return { value: null, error: 'Enter a decimal number, such as 12 or 1.5e2.' }
	}
	const value = Number(text)
	if (!Number.isFinite(value)) {return { value: null, error: 'Enter a finite number.' }}
	if (operator.type === 'integer' && !Number.isSafeInteger(value)) {
		return { value: null, error: 'Enter a whole number between -9007199254740991 and 9007199254740991.' }
	}
	const { minValue: min, maxValue: max } = operator
	if ((min !== undefined && !Number.isFinite(min)) || (max !== undefined && !Number.isFinite(max)) || (min !== undefined && max !== undefined && min > max)) {
		return { value: null, error: 'This filter has invalid numeric bounds. Ask the app author to check its configuration.' }
	}
	if (min !== undefined && value < min) {return { value: null, error: `Enter a number at least ${min}.` }}
	if (max !== undefined && value > max) {return { value: null, error: `Enter a number no greater than ${max}.` }}
	return { value: { type: operator.type, value }, error: null }
}
