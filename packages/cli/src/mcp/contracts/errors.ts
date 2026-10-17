// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Shared error vocabulary — see errors.d.ts for the contract.

export const CONTRACT_ERROR_CODES = [
	'invalid_selection',
	'ambiguous_selection',
	'permission_denied',
	'unsupported_capability',
	'prerequisite_missing',
	'target_busy',
	'stale_identity',
	'disconnected_runtime',
	'execution_failure',
	'not_found',
	'cancelled',
	'timeout',
	'unavailable',
]

export function contractError(code, message, options = {}) {
	const error = { code, message }
	if (options.recovery) {
		error.recovery = options.recovery
	}

	if (options.retryable !== undefined) {
		error.retryable = options.retryable
	}

	if (options.context) {
		error.context = options.context
	}

	return error
}

export const ok = (data) => ({ ok: true, data })
export const fail = (error) => ({ ok: false, error })

export function isContractError(value) {
	return (
		typeof value === 'object' &&
		value !== null &&
		CONTRACT_ERROR_CODES.includes(value.code) &&
		typeof value.message === 'string'
	)
}

export function toContractError(value, fallbackCode = 'execution_failure') {
	if (isContractError(value)) {
		return value
	}

	if (value instanceof Error) {
		return contractError(fallbackCode, value.message)
	}

	return contractError(fallbackCode, typeof value === 'string' ? value : 'Unknown failure')
}
