import { createAnimatedValue } from './animated-value'
import { readReducedMotion, writeAnimatedProperty } from './animation-host.macos'
import type { PaneRouteTransitions } from './pane-route-transition-types'
import type {
	AppKitTransitionOptions,
	AppKitTransitionValues,
	NativeTransitionDefinition,
	RouteTransitionResult,
} from './props'

const definitions = new WeakMap<NativeTransitionDefinition, Readonly<AppKitTransitionOptions>>()
const neutral: Required<AppKitTransitionValues> = Object.freeze({
	opacity: 1,
	translateX: 0,
	translateY: 0,
	scaleX: 1,
	scaleY: 1,
	rotate: 0,
})

function checkedValues(values: AppKitTransitionValues): AppKitTransitionValues {
	if (!values || typeof values !== 'object' || Array.isArray(values)) {
		throw new TypeError('Expected AppKit transition starting values')
	}
	if (typeof (values as { then?: unknown }).then === 'function') {
		void Promise.resolve(values as unknown as PromiseLike<unknown>).catch(() => {})
		throw new TypeError('AppKit transition starting values must be synchronous')
	}
	const captured: AppKitTransitionValues = {}
	for (const [key, value] of Object.entries(values)) {
		if (
			!Object.hasOwn(neutral, key) ||
			(value !== undefined && (typeof value !== 'number' || !Number.isFinite(value))) ||
			(key === 'opacity' && (value < 0 || value > 1))
		) {
			throw new TypeError('Invalid AppKit transition property: ' + key)
		}

		if (value !== undefined) {
			captured[key as keyof AppKitTransitionValues] = value
		}
	}
	return Object.freeze(captured)
}

/** Animate an incoming retained AppKit pane to its normal appearance. Starting
 * values use layout units and degrees; duration uses milliseconds. The router
 * owns the wrapper, completion and restoration, including interrupted effects.
 * @example
 * import { defineAppKitTransition } from '@octane-xplat/ui/macos'
 * export const detail = defineAppKitTransition({ from: ({ direction }) => ({ opacity: 0, translateX: direction === 'back' ? -24 : 24 }), duration: 240 })
 */
export function defineAppKitTransition(
	options: AppKitTransitionOptions,
): NativeTransitionDefinition {
	if (!options || !Number.isFinite(options.duration ?? 240) || (options.duration ?? 240) < 0) {
		throw new TypeError('Expected a nonnegative AppKit transition duration')
	}
	const from = typeof options.from === 'function' ? options.from : checkedValues(options.from)
	const definition = Object.freeze({ kind: 'native' }) as NativeTransitionDefinition
	definitions.set(definition, Object.freeze({ ...options, from }))
	return definition
}

/** @internal One coordinator per flow; no mutable animation state is shared
 * between router instances, windows or independently mounted panes. */
export function createAppKitRouteTransitions(): PaneRouteTransitions {
	let active: (() => void) | undefined
	const interrupt = () => {
		active?.()
	}
	return {
		interrupt,
		run(context, name, definition, view) {
			interrupt()
			const skipped = (reason: 'disabled' | 'unsupported' | 'reduced-motion') =>
				Promise.resolve<RouteTransitionResult>({ status: 'skipped', reason })
			if (!name || name === 'none' || definition?.kind === 'skip' || context.action === 'refresh') {
				return skipped('disabled')
			}
			const options = definition?.kind === 'native' ? definitions.get(definition) : undefined
			if (!options || !view) {
				return skipped('unsupported')
			}
			try {
				if (options.reducedMotion !== 'allow' && readReducedMotion()) {
					return skipped('reduced-motion')
				}
			} catch (error) {
				return Promise.resolve({ status: 'failed', error })
			}
			const controllers: ReturnType<typeof createAnimatedValue>[] = []
			const restore: (() => void)[] = []
			return new Promise<RouteTransitionResult>((resolve) => {
				let settled = false
				const finish = (result: RouteTransitionResult) => {
					if (settled) {
						return
					}
					settled = true
					active = undefined
					const errors: unknown[] = []
					for (const controller of controllers) {
						controller.dispose()
					}
					for (const reset of restore) {
						try {
							reset()
						} catch (error) {
							errors.push(error)
						}
					}
					resolve(
						errors.length
							? {
									status: 'failed',
									error: new AggregateError(errors, 'AppKit transition restoration failed'),
								}
							: result,
					)
				}
				active = () => finish({ status: 'skipped', reason: 'interrupted' })
				try {
					const values = checkedValues(
						typeof options.from === 'function' ? options.from(context) : options.from,
					)

					if (settled) {
						return
					}

					const tasks = Object.entries(values).map(([property, initial]) => {
						const target = neutral[property as keyof AppKitTransitionValues]
						restore.push(() => writeAnimatedProperty(view, property, target))
						const controller = createAnimatedValue(initial, {
							now: () => Date.now(),
							request: (callback) => setTimeout(callback, 16) as unknown as number,
							cancel: (id) => clearTimeout(id),
							write: (targetView, value) => writeAnimatedProperty(targetView, property, value),
							reducedMotion: options.reducedMotion === 'allow' ? undefined : readReducedMotion,
						})
						controllers.push(controller)
						controller.ref(view)
						return controller.to(target, { duration: options.duration ?? 240 })
					})

					void Promise.all(tasks).then(
						(results) => {
							const failure = results.find((result) => result.status === 'failed')
							finish(
								failure?.status === 'failed'
									? { status: 'failed', error: failure.error }
									: { status: 'completed' },
							)
						},
						(error) => finish({ status: 'failed', error }),
					)
				} catch (error) {
					finish({ status: 'failed', error })
				}
			})
		},
	}
}
