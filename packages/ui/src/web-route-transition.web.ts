import type { TransitionDefinition, WebTransitionOptions } from './props'

/** Configure a CSS View Transition. The router owns the update callback and
 * flushing. Reduced motion and missing browser support skip the effect.
 * @example
 * import { defineWebTransition } from '@octane-xplat/ui/web'
 * export const detail = defineWebTransition({ types: ({ direction }) => ['detail-' + direction] })
 */
export function defineWebTransition(options: WebTransitionOptions = {}): TransitionDefinition {
	return Object.freeze({
		kind: 'web',
		options: Object.freeze({
			...options,
			types: Array.isArray(options.types) ? Object.freeze([...options.types]) : options.types,
		}),
	})
}
