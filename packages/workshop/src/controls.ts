/**
 * Control application helpers — host-agnostic. The next props bag is always
 * complete: Unset removes the key entirely; removed keys reach the renderer
 * as explicit `undefined` so nothing stale merges forward.
 */
import type { StoryDefinition } from './contract'

export const UNSET: unique symbol = Symbol.for('xplat-workshop.unset')
export type ControlValueInput = boolean | string | number | typeof UNSET

export interface FieldError {
	message: string
}

export function isUnsettable(definition: StoryDefinition<any, any, any>, key: string): boolean {
	const control = definition.controls?.[key] as { allowUnset?: boolean } | undefined
	if (!control) {
		return false
	}

	return control.allowUnset === true || !(key in (definition.args ?? {}))
}

/** Clone default args per generation — nested data must not leak across runs. */
export function freshArgs(args: Record<string, unknown>): Record<string, unknown> {
	const clone = (value: unknown): unknown => {
		if (Array.isArray(value)) {
			return value.map(clone)
		}

		if (value !== null && typeof value === 'object') {
			const proto = Object.getPrototypeOf(value)
			if (proto !== Object.prototype && proto !== null) {
				return value // class instances / stores: pass through, do not clone
			}

			const out: Record<string, unknown> = {}
			for (const [k, v] of Object.entries(value)) {
				out[k] = clone(v)
			}

			return out
		}

		return value // functions and primitives pass through
	}

	return clone(args) as Record<string, unknown>
}

/**
 * Validate and fold a control input into the next props bag. Returns either
 * the next complete bag or a per-field error; invalid input never mutates.
 */
export function applyControlInput(
	definition: StoryDefinition<any, any, any>,
	currentProps: Record<string, unknown>,
	key: string,
	raw: string | boolean | number | typeof UNSET,
): { props?: Record<string, unknown>; error?: FieldError } {
	const control = definition.controls?.[key] as
		| {
				type: string
				min?: number
				max?: number
				options?: readonly unknown[]
				allowUnset?: boolean
		  }
		| undefined

	if (!control) {
		return { error: { message: `no control declared for "${key}"` } }
	}

	const next = { ...currentProps }
	if (raw === UNSET) {
		if (!isUnsettable(definition, key)) {
			return { error: { message: `"${key}" is a required prop and cannot be unset` } }
		}

		delete next[key]
		return { props: next }
	}

	switch (control.type) {
		case 'boolean': {
			if (typeof raw !== 'boolean') {
				return { error: { message: 'expected a boolean' } }
			}

			next[key] = raw
			return { props: next }
		}
		case 'string': {
			if (typeof raw !== 'string') {
				return { error: { message: 'expected a string' } }
			}

			next[key] = raw
			return { props: next }
		}
		case 'number': {
			const value =
				typeof raw === 'number'
					? raw
					: typeof raw === 'string' && raw.trim() === ''
						? NaN
						: Number(raw)

			if (!Number.isFinite(value)) {
				return { error: { message: `"${key}" needs a finite number` } }
			}

			if (control.min !== undefined && value < control.min) {
				return { error: { message: `"${key}" must be ≥ ${control.min}` } }
			}

			if (control.max !== undefined && value > control.max) {
				return { error: { message: `"${key}" must be ≤ ${control.max}` } }
			}

			next[key] = value
			return { props: next }
		}
		case 'enum': {
			if (!(control.options ?? []).some((option) => Object.is(option, raw))) {
				return {
					error: {
						message: `"${key}" must be one of: ${(control.options ?? []).map(String).join(', ')}`,
					},
				}
			}

			next[key] = raw
			return { props: next }
		}
		default:
			return { error: { message: `unsupported control type "${control.type}"` } }
	}
}

/**
 * Produce the props object handed to the renderer: next bag plus explicit
 * `undefined` for every key present before and absent now — removal is
 * visible to hosts that reconcile keys rather than whole objects.
 */
export function reconcileProps(
	previous: Record<string, unknown>,
	next: Record<string, unknown>,
): Record<string, unknown> {
	const merged: Record<string, unknown> = { ...next }
	for (const key of Object.keys(previous)) {
		if (!(key in next)) {
			merged[key] = undefined
		}
	}

	return merged
}
