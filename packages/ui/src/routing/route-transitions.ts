import type { TransitionRegistry } from '../props'

/** Register immutable named platform definitions; generated registration infers
 * their keys. Empty names and built-in overrides throw before configuration.
 * @example
 * import { defineTransitions } from '@octane-xplat/ui/routing/core'
 * export const transitions = defineTransitions({ detail: { kind: 'skip' } })
 */
export function defineTransitions<const Definitions extends TransitionRegistry>(
	definitions: Definitions,
): Definitions {
	const snapshot: Record<string, TransitionRegistry[string]> = {}
	for (const [name, definition] of Object.entries(definitions)) {
		if (!name || ['default', 'none', 'fade'].includes(name)) {
			throw new TypeError(`Reserved or empty route transition name: ${name}`)
		}

		if (!definition || !['web', 'native', 'skip'].includes(definition.kind)) {
			throw new TypeError(`Invalid route transition definition: ${name}`)
		}

		if (definition.kind === 'web') {
			const options = definition.options
			if (!options || typeof options !== 'object') {
				throw new TypeError(`Invalid browser transition options: ${name}`)
			}

			Object.defineProperty(snapshot, name, {
				enumerable: true,
				value: Object.freeze({
					kind: 'web',
					options: Object.freeze({
						...options,
						types: Array.isArray(options.types) ? Object.freeze([...options.types]) : options.types,
					}),
				}),
			})
		} else if (definition.kind === 'native') {
			// The native helper owns its opaque factory and freezes the definition.
			Object.defineProperty(snapshot, name, { enumerable: true, value: definition })
		} else {
			Object.defineProperty(snapshot, name, {
				enumerable: true,
				value: Object.freeze({ kind: 'skip' }),
			})
		}
	}
	return Object.freeze(snapshot) as Definitions
}
