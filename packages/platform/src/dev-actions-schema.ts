// Runtime-validatable input/result contracts for development actions.
//
// This is the app-side implementation of the field subset documented in
// @octane-xplat/mcp's contracts/actions module — same keywords, same
// semantics. The MCP server validates again before dispatch; the app
// re-validates at execution so a hand-rolled call can't skip the contract.

export type DevActionFieldType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array'

export interface DevActionField {
	type: DevActionFieldType
	description?: string
	/** Applied when the caller omits the field. */
	default?: unknown
	/** Closed value set. */
	enum?: readonly unknown[]
	minLength?: number
	maxLength?: number
	/** Regular expression source (must compile). */
	pattern?: string
	minimum?: number
	maximum?: number
	minItems?: number
	maxItems?: number
	/** For `object`: named nested fields. Defaults apply to top-level fields only. */
	fields?: Record<string, DevActionField>
	/** For `array`: element contract. */
	items?: DevActionField
}

/** Named typed fields. `{}` (or omitted) means the action takes no arguments. */
export interface DevActionFields {
	fields?: Record<string, DevActionField>
}

export type DevActionValidation =
	| { ok: true; value: Record<string, unknown> }
	| { ok: false; errors: string[] }

const FIELD_TYPES: ReadonlySet<string> = new Set([
	'string',
	'number',
	'integer',
	'boolean',
	'object',
	'array',
])

const ACTION_ID = /^[a-z0-9][a-z0-9._-]{1,127}$/i

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

function validateField(field: DevActionField, path: string, problems: string[]) {
	if (!isRecord(field) || !FIELD_TYPES.has(field.type)) {
		problems.push(`${path}: missing or unknown field type`)
		return
	}

	if (field.pattern !== undefined) {
		try {
			new RegExp(field.pattern)
		} catch {
			problems.push(`${path}.pattern: does not compile`)
		}
	}

	if (field.fields) {
		for (const [name, nested] of Object.entries(field.fields)) {
			validateField(nested as DevActionField, `${path}.fields.${name}`, problems)
		}
	}

	if (field.items) {
		validateField(field.items as DevActionField, `${path}.items`, problems)
	}
}

const validateFields = (
	contract: DevActionFields | undefined,
	path: string,
	problems: string[],
) => {
	if (contract === undefined) {
		return
	}

	if (!isRecord(contract) || (contract.fields !== undefined && !isRecord(contract.fields))) {
		problems.push(`${path}: must be a { fields } contract`)
		return
	}

	const fields = (contract.fields ?? {}) as Record<string, DevActionField>
	for (const [name, field] of Object.entries(fields)) {
		validateField(field, `${path}.fields.${name}`, problems)
	}
}

/** Declaration sanity: id shape, required metadata, compilable field patterns. */
export function validateActionDeclaration(action: unknown): string[] {
	const problems: string[] = []
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

	const effects = action.effects as Record<string, unknown> | undefined
	if (!isRecord(effects) || typeof effects.summary !== 'string') {
		problems.push('effects.summary: required')
	}

	const route = (action as { route?: unknown }).route
	if (
		route !== undefined &&
		typeof route !== 'function' &&
		(typeof route !== 'string' || !route.trim())
	) {
		problems.push('route: must be a non-empty URL string or an input-derived function')
	}

	validateFields(action.input as DevActionFields | undefined, 'input', problems)
	validateFields(action.result as DevActionFields | undefined, 'result', problems)
	return problems
}

const checkValue = (field: DevActionField, value: unknown, path: string, errors: string[]) => {
	const typeOf = (v: unknown) =>
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
		const s = value as string
		if (field.minLength !== undefined && s.length < field.minLength) {
			errors.push(`${path}: shorter than minLength ${field.minLength}`)
		}

		if (field.maxLength !== undefined && s.length > field.maxLength) {
			errors.push(`${path}: longer than maxLength ${field.maxLength}`)
		}

		if (field.pattern !== undefined && !new RegExp(field.pattern).test(s)) {
			errors.push(`${path}: does not match pattern`)
		}
	}

	if (field.type === 'number' || field.type === 'integer') {
		const n = value as number
		if (field.minimum !== undefined && n < field.minimum) {
			errors.push(`${path}: below minimum ${field.minimum}`)
		}

		if (field.maximum !== undefined && n > field.maximum) {
			errors.push(`${path}: above maximum ${field.maximum}`)
		}
	}

	if (field.type === 'array') {
		const items = value as unknown[]
		if (field.minItems !== undefined && items.length < field.minItems) {
			errors.push(`${path}: fewer than minItems ${field.minItems}`)
		}

		if (field.maxItems !== undefined && items.length > field.maxItems) {
			errors.push(`${path}: more than maxItems ${field.maxItems}`)
		}

		if (field.items) {
			items.forEach((item, index) =>
				checkValue(field.items as DevActionField, item, `${path}[${index}]`, errors),
			)
		}
	}

	if (field.type === 'object' && field.fields) {
		checkFields(field.fields, value as Record<string, unknown>, path, errors)
	}
}

function checkFields(
	fields: Record<string, DevActionField>,
	value: Record<string, unknown>,
	path: string,
	errors: string[],
	out: Record<string, unknown> | null = null,
) {
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

function validateAgainst(
	contract: DevActionFields | undefined,
	value: unknown,
	basePath: string,
): DevActionValidation {
	if (!isRecord(value)) {
		return { ok: false, errors: [`${basePath}: expected an object of named fields`] }
	}

	const fields = contract?.fields ?? {}
	const out: Record<string, unknown> = {}
	const errors: string[] = []
	checkFields(fields, value, basePath, errors, out)
	return errors.length ? { ok: false, errors } : { ok: true, value: out }
}

/** Type-check + apply defaults + reject undeclared fields. */
export function validateActionInput(
	contract: DevActionFields | undefined,
	input: unknown,
): DevActionValidation {
	return validateAgainst(contract, input ?? {}, 'input')
}

/** Result-contract validation — invalid output fails explicitly. */
export function validateActionOutput(
	contract: DevActionFields | undefined,
	output: unknown,
): DevActionValidation {
	return validateAgainst(contract, output ?? {}, 'result')
}
