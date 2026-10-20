// The explicit declaration entry preserves NativeScript option types under NodeNext.
// oxlint-disable-next-line xplat/no-nativescript-import -- Types for the NativeScript-only integration subpath; portable contracts use an opaque brand.
import type { NavigationTransition } from '@nativescript/core/ui/frame/index.js'
import type {
	NativeTransitionDefinition,
	NativeViewTransitionValues,
	PreparedRouteMatch,
	RouteTransitionContext,
	RouteTransitionResult,
	TransitionDefinition,
} from './props'

export type { NativeViewTransitionValues } from './props'

import { readNativeReducedMotion } from './native-route-motion-policy'

/** Inputs available when opening a native page. NativeScript owns reverse
 * animation on Back using the selected transition's native direction methods. */
export type NativeTransitionContext = Omit<RouteTransitionContext, 'direction' | 'to'> & {
	to: PreparedRouteMatch
}

/** Incoming pane/modal content motion. The router owns the target, cancellation
 * and restoration; application screen styles are not animation targets. */
export interface NativeViewTransitionOptions {
	from:
		| Readonly<NativeViewTransitionValues>
		| ((context: RouteTransitionContext) => Readonly<NativeViewTransitionValues>)
	duration?: number
	curve?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
}

type NativePageTransitionFactory = (
	context: NativeTransitionContext,
) => NavigationTransition & { readonly then?: never }

/** Frame pages and rendered views use distinct SDK engines. Supply either or
 * both; an absent implementation reports skipped on that kind of host. */
export type NativeTransitionOptions = {
	reducedMotion?: 'skip' | 'allow'
} & (
	| { page: NativePageTransitionFactory; view?: NativeViewTransitionOptions }
	| { page?: NativePageTransitionFactory; view: NativeViewTransitionOptions }
)

interface StoredNativeTransitionOptions {
	reducedMotion?: 'skip' | 'allow'
	page?: NativePageTransitionFactory
	view?: Readonly<NativeViewTransitionOptions>
}

const definitions = new WeakMap<NativeTransitionDefinition, StoredNativeTransitionOptions>()

/** Adapt NativeScript's NavigationTransition while keeping shared names typed.
 * The factory runs once when opening a page, after preparation. The engine
 * reverses that effect on Back; the factory is not called again for Back.
 * A view implementation uses the SDK Animation engine for incoming content.
 * @example
 * import { defineNativeTransition } from '@octane-xplat/ui/nativescript'
 * export const detail = defineNativeTransition({ page: () => ({ name: 'slideLeft', duration: 240 }) })
 */
export function defineNativeTransition(
	options: NativeTransitionOptions,
): NativeTransitionDefinition {
	if (
		!options ||
		(options.page !== undefined && typeof options.page !== 'function') ||
		(!options.page && !options.view)
	) {
		throw new TypeError('Expected a native page factory or view transition')
	}
	const view = options.view
		? Object.freeze({
				...options.view,
				from:
					typeof options.view.from === 'function'
						? options.view.from
						: checkedNativeViewValues(options.view.from),
			})
		: undefined
	if (
		view &&
		(!Number.isFinite(view.duration ?? 240) ||
			(view.duration ?? 240) < 0 ||
			(view.curve !== undefined &&
				!['linear', 'easeIn', 'easeOut', 'easeInOut'].includes(view.curve)))
	) {
		throw new TypeError('Expected a nonnegative view duration and a supported SDK curve')
	}
	const definition = Object.freeze({ kind: 'native' }) as NativeTransitionDefinition
	definitions.set(definition, Object.freeze({ ...options, view }))
	return definition
}

/** @internal NativeScript receives the original engine instance, never a
 * serialized or generic animation description. Failure affects motion only. */
export function resolveNativePageTransition(
	name: string | undefined,
	definition: TransitionDefinition | undefined,
	context: NativeTransitionContext,
): { animated: boolean; transition?: NavigationTransition; result?: RouteTransitionResult } {
	const skipped = (reason: 'disabled' | 'unsupported' | 'reduced-motion') => ({
		animated: false,
		result: { status: 'skipped', reason } as RouteTransitionResult,
	})
	if (name === 'none' || definition?.kind === 'skip') {
		return skipped('disabled')
	}
	const options = definition?.kind === 'native' ? definitions.get(definition) : undefined
	if (options && !options.page) {
		return skipped('unsupported')
	}
	if (!options && (definition || (name && !['default', 'fade'].includes(name)))) {
		return skipped('unsupported')
	}
	if (options?.reducedMotion !== 'allow' && readNativeReducedMotion()) {
		return skipped('reduced-motion')
	}
	const page = options?.page
	if (options && page) {
		try {
			const transition = page(context)
			if (!transition || typeof transition !== 'object') {
				throw new TypeError('A native transition factory must return NavigationTransition')
			}

			if (typeof (transition as { then?: unknown }).then === 'function') {
				void Promise.resolve(transition as unknown as PromiseLike<unknown>).catch(() => {})
				throw new TypeError('A native transition factory must be synchronous')
			}

			return { animated: true, transition: { ...transition } }
		} catch (error) {
			return { animated: false, result: { status: 'failed', error } }
		}
	}
	return { animated: true, transition: name === 'fade' ? { name: 'fade' } : undefined }
}

const neutralViewValues: Required<NativeViewTransitionValues> = Object.freeze({
	opacity: 1,
	translateX: 0,
	translateY: 0,
	scaleX: 1,
	scaleY: 1,
	rotate: 0,
})

/** @internal Capture only supported flat numeric properties. */
export function checkedNativeViewValues(
	values: NativeViewTransitionValues,
): Readonly<NativeViewTransitionValues> {
	if (!values || typeof values !== 'object' || Array.isArray(values)) {
		throw new TypeError('Expected native view starting values')
	}
	if (typeof (values as { then?: unknown }).then === 'function') {
		void Promise.resolve(values as unknown as PromiseLike<unknown>).catch(() => {})
		throw new TypeError('Native view starting values must be synchronous')
	}
	const captured: NativeViewTransitionValues = {}
	for (const [key, value] of Object.entries(values)) {
		if (
			!Object.hasOwn(neutralViewValues, key) ||
			(value !== undefined && (typeof value !== 'number' || !Number.isFinite(value))) ||
			(key === 'opacity' && (value < 0 || value > 1))
		) {
			throw new TypeError('Invalid native view transition property: ' + key)
		}

		if (value !== undefined) {
			captured[key as keyof NativeViewTransitionValues] = value
		}
	}
	return Object.freeze(captured)
}

/** @internal Resolve view policy without exposing targets or animation handles. */
export function resolveNativeViewTransition(
	name: string | undefined,
	definition: TransitionDefinition | undefined,
	context: RouteTransitionContext,
):
	| {
			values: Readonly<NativeViewTransitionValues>
			duration: number
			curve: NativeViewTransitionOptions['curve']
	  }
	| RouteTransitionResult {
	if (!name || name === 'none' || definition?.kind === 'skip' || context.action === 'refresh') {
		return { status: 'skipped', reason: 'disabled' }
	}
	const options = definition?.kind === 'native' ? definitions.get(definition) : undefined
	const view =
		options?.view ??
		(!definition && name === 'fade' ? { from: { opacity: 0 }, duration: 240 } : undefined)
	if (!view) {
		return { status: 'skipped', reason: 'unsupported' }
	}
	try {
		if (options?.reducedMotion !== 'allow' && readNativeReducedMotion()) {
			return { status: 'skipped', reason: 'reduced-motion' }
		}

		const values = checkedNativeViewValues(
			typeof view.from === 'function' ? view.from(context) : view.from,
		)

		return { values, duration: view.duration ?? 240, curve: view.curve }
	} catch (error) {
		return { status: 'failed', error }
	}
}
