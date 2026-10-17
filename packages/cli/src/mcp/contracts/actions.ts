// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Development-action contract — see actions.d.ts. The app-side registry in
// @octane-xplat/platform implements the same field subset; keep the two
// validators aligned (same keywords, same rejection order semantics).

export const DEV_ACTIONS_PROTOCOL = 'xplat-dev-actions'
export const DEV_ACTIONS_PROTOCOL_VERSION = 1
export const DEV_ACTIONS_ANNOUNCE_INTERVAL_MS = 5_000
export const DEV_ACTIONS_STALE_AFTER_MS = 15_000
export const DEV_ACTIONS_QUEUE_LIMIT = 8
export const DEV_ACTIONS_OVERLAP_LIMIT = 16
export const DEV_ACTIONS_DEFAULT_TIMEOUT_MS = 30_000
export const DEV_ACTIONS_MAX_TIMEOUT_MS = 300_000

const FIELD_TYPES = new Set(['string', 'number', 'integer', 'boolean', 'object', 'array'])
const ACTION_ID = /^[a-z0-9][a-z0-9._-]{1,127}$/i

const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)

function validateField(field, path, problems) {
	if (!isRecord(field) || !FIELD_TYPES.has(field.type)) {
		problems.push(`${path}: missing or unknown field type`)
		return
	}

	for (const key of ['minLength', 'maxLength', 'minimum', 'maximum', 'minItems', 'maxItems']) {
		if (field[key] !== undefined && typeof field[key] !== 'number') {
			problems.push(`${path}.${key}: must be a number`)
		}
	}

	if (field.pattern !== undefined) {
		try {
			new RegExp(field.pattern)
		} catch {
			problems.push(`${path}.pattern: does not compile`)
		}
	}

	if (field.fields !== undefined) {
		if (!isRecord(field.fields)) {
			problems.push(`${path}.fields: must be a named field map`)
		} else {
			for (const [name, nested] of Object.entries(field.fields)) {
				validateField(nested, `${path}.fields.${name}`, problems)
			}
		}
	}

	if (field.items !== undefined) {
		validateField(field.items, `${path}.items`, problems)
	}
}

const validateFields = (contract, path, problems) => {
	if (contract === undefined) {
		return
	}

	if (!isRecord(contract) || (contract.fields !== undefined && !isRecord(contract.fields))) {
		problems.push(`${path}: must be a { fields } contract`)
		return
	}

	for (const [name, field] of Object.entries(contract.fields ?? {})) {
		validateField(field, `${path}.fields.${name}`, problems)
	}
}

export function validateActionDeclaration(action) {
	const problems = []
	if (!isRecord(action)) {
		return ['action declaration must be an object']
	}

	if (typeof action.id !== 'string' || !ACTION_ID.test(action.id)) {
		problems.push('id: required, 2-128 chars of [a-z0-9._-] starting alphanumeric')
	}

	if (typeof action.title !== 'string' || !action.title.trim()) {
		problems.push('title: required')
	}

	if (typeof action.description !== 'string' || !action.description.trim()) {
		problems.push('description: required')
	}

	if (!isRecord(action.effects) || typeof action.effects.summary !== 'string') {
		problems.push('effects.summary: required')
	}

	validateFields(action.input, 'input', problems)
	validateFields(action.result, 'result', problems)

	if (action.availability?.platforms !== undefined) {
		if (!Array.isArray(action.availability.platforms)) {
			problems.push('availability.platforms: must be an array')
		}
	}

	if (
		action.execution?.concurrency !== undefined &&
		!['serialized', 'overlap'].includes(action.execution.concurrency)
	) {
		problems.push('execution.concurrency: must be "serialized" or "overlap"')
	}

	if (
		action.execution?.timeoutMs !== undefined &&
		(typeof action.execution.timeoutMs !== 'number' || action.execution.timeoutMs <= 0)
	) {
		problems.push('execution.timeoutMs: must be a positive number')
	}

	return problems
}

// ---------- field validation ----------

const checkValue = (field, value, path, errors) => {
	const typeOf = (v) =>
		v === null
			? 'null'
			: Array.isArray(v)
				? 'array'
				: typeof v === 'number' && Number.isInteger(v)
					? 'integer'
					: typeof v

	const type = typeOf(value)
	const matches =
		field.type === 'number'
			? type === 'number' || type === 'integer'
			: field.type === 'integer'
				? type === 'integer'
				: field.type === 'object'
					? type === 'object'
					: field.type === 'array'
						? type === 'array'
						: type === field.type

	if (!matches) {
		errors.push(`${path}: expected ${field.type}, got ${type}`)
		return
	}

	if (field.enum && !field.enum.some((candidate) => candidate === value)) {
		errors.push(`${path}: not one of the declared values`)
	}

	if (field.type === 'string') {
		if (field.minLength !== undefined && value.length < field.minLength) {
			errors.push(`${path}: shorter than minLength ${field.minLength}`)
		}

		if (field.maxLength !== undefined && value.length > field.maxLength) {
			errors.push(`${path}: longer than maxLength ${field.maxLength}`)
		}

		if (field.pattern !== undefined && !new RegExp(field.pattern).test(value)) {
			errors.push(`${path}: does not match pattern`)
		}
	}

	if (field.type === 'number' || field.type === 'integer') {
		if (field.minimum !== undefined && value < field.minimum) {
			errors.push(`${path}: below minimum ${field.minimum}`)
		}

		if (field.maximum !== undefined && value > field.maximum) {
			errors.push(`${path}: above maximum ${field.maximum}`)
		}
	}

	if (field.type === 'array') {
		if (field.minItems !== undefined && value.length < field.minItems) {
			errors.push(`${path}: fewer than minItems ${field.minItems}`)
		}

		if (field.maxItems !== undefined && value.length > field.maxItems) {
			errors.push(`${path}: more than maxItems ${field.maxItems}`)
		}

		if (field.items) {
			value.forEach((item, index) => checkValue(field.items, item, `${path}[${index}]`, errors))
		}
	}

	if (field.type === 'object' && field.fields) {
		checkFields(field.fields, value, path, errors)
	}
}

// Validates a value against a named field map: undeclared keys are rejected,
// missing keys get defaults applied into `out`.
function checkFields(fields, value, path, errors, out = null) {
	for (const [name, field] of Object.entries(fields)) {
		const present = Object.prototype.hasOwnProperty.call(value, name) && value[name] !== undefined
		if (!present) {
			if (field.default === undefined) {
				errors.push(`${path}.${name}: required`)
			} else if (out) {
				out[name] = field.default
			}

			continue
		}

		if (out) {
			out[name] = value[name]
		}

		checkValue(field, value[name], `${path}.${name}`, errors)
	}

	for (const key of Object.keys(value)) {
		if (!Object.prototype.hasOwnProperty.call(fields, key)) {
			errors.push(`${path}.${key}: not a declared field`)
		}
	}
}

function validateAgainst(contract, value, basePath) {
	if (!isRecord(value)) {
		return { ok: false, errors: [`${basePath}: expected an object of named fields`] }
	}

	const fields = contract?.fields ?? {}
	const out = {}
	const errors = []
	checkFields(fields, value, basePath, errors, out)
	return errors.length ? { ok: false, errors } : { ok: true, value: out }
}

export function validateActionInput(contract, input) {
	return validateAgainst(contract, input ?? {}, 'input')
}

export function validateActionOutput(contract, output) {
	return validateAgainst(contract, output ?? {}, 'result')
}

export function isDevActionAnnouncement(value) {
	return (
		isRecord(value) &&
		value.protocol === DEV_ACTIONS_PROTOCOL &&
		typeof value.appInstanceId === 'string' &&
		typeof value.revision === 'number' &&
		Array.isArray(value.actions)
	)
}

export function actionAvailability(action, platform) {
	const availability = action.availability
	if (availability?.platforms && !availability.platforms.includes(platform)) {
		return { ready: false, reason: `not applicable on ${platform}` }
	}

	if (availability?.ready === false) {
		return { ready: false, reason: availability.reason ?? 'reported unavailable by the app' }
	}

	return { ready: true }
}
