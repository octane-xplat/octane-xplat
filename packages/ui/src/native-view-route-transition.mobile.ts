// oxlint-disable-next-line xplat/no-nativescript-import -- SDK engine for native router-owned views only.
import { Animation, View } from '@nativescript/core'
import { resolveNativeViewTransition } from './native-route-transition'
import type { PaneRouteTransitions } from './pane-route-transition-types'
import type { NativeViewTransitionValues, RouteTransitionResult } from './props'

const neutral: Required<NativeViewTransitionValues> = Object.freeze({
	opacity: 1,
	translateX: 0,
	translateY: 0,
	scaleX: 1,
	scaleY: 1,
	rotate: 0,
})

/** One SDK animation per flow/surface; never animate an application's screen. */
export function createNativeViewRouteTransitions(): PaneRouteTransitions {
	let active: (() => void) | undefined
	const interrupt = () => active?.()
	return {
		interrupt,
		run(context, name, definition, target) {
			interrupt()
			const resolved = resolveNativeViewTransition(name, definition, context)
			if ('status' in resolved) {
				return Promise.resolve(resolved)
			}
			if (!(target instanceof View) || !target.nativeViewProtected) {
				return Promise.resolve({ status: 'skipped', reason: 'unsupported' })
			}
			const view = target
			return new Promise<RouteTransitionResult>((resolve) => {
				let animation: Animation | undefined
				let settled = false
				const finish = (result: RouteTransitionResult, cancel = false) => {
					if (settled) {
						return
					}
					settled = true
					active = undefined
					const errors: unknown[] = []
					if (cancel && animation?.isPlaying) {
						try {
							animation.cancel()
						} catch (error) {
							errors.push(error)
						}
					}
					try {
						view.opacity = neutral.opacity
						view.translateX = neutral.translateX
						view.translateY = neutral.translateY
						view.scaleX = neutral.scaleX
						view.scaleY = neutral.scaleY
						view.rotate = neutral.rotate
					} catch (error) {
						errors.push(error)
					}
					resolve(
						errors.length
							? {
									status: 'failed',
									error: new AggregateError(errors, 'Native view motion cleanup failed'),
								}
							: result,
					)
				}
				active = () => finish({ status: 'skipped', reason: 'interrupted' }, true)
				try {
					const { values, duration, curve } = resolved
					if (!Object.keys(values).length || duration === 0) {
						finish({ status: 'completed' })
						return
					}

					if (values.opacity !== undefined) {
						view.opacity = values.opacity
					}

					if (values.translateX !== undefined) {
						view.translateX = values.translateX
					}

					if (values.translateY !== undefined) {
						view.translateY = values.translateY
					}

					if (values.scaleX !== undefined) {
						view.scaleX = values.scaleX
					}

					if (values.scaleY !== undefined) {
						view.scaleY = values.scaleY
					}

					if (values.rotate !== undefined) {
						view.rotate = values.rotate
					}

					animation = new Animation([
						{
							target: view,
							...(values.opacity !== undefined ? { opacity: neutral.opacity } : {}),
							...(values.translateX !== undefined || values.translateY !== undefined
								? { translate: { x: neutral.translateX, y: neutral.translateY } }
								: {}),
							...(values.scaleX !== undefined || values.scaleY !== undefined
								? { scale: { x: neutral.scaleX, y: neutral.scaleY } }
								: {}),
							...(values.rotate !== undefined ? { rotate: neutral.rotate } : {}),
							duration,
							curve,
						},
					])

					void animation.play().then(
						() => finish({ status: 'completed' }),
						(error) => finish({ status: 'failed', error }),
					)
				} catch (error) {
					finish({ status: 'failed', error }, true)
				}
			})
		},
	}
}
