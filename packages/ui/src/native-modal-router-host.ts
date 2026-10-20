// oxlint-disable-next-line xplat/no-nativescript-import -- Native-only modal host selected by the native default router.
import { GridLayout } from '@nativescript/core'
import { createNativeRouterHost } from './native-router-host'
import { createPaneRouterHost } from './pane-router-host'
import { createPaneRouteTransitions } from './pane-route-transitions'
import { readNativeReducedMotion } from './native-route-motion-policy'
import {
	createModalRouterHost,
	type RouterModalSurface,
	type RouterModalSurfaceRequest,
} from './modal-router-host'

import { applyThemeClasses } from './theme/theme-host'
import { modalPresenter } from './modal-presenter'
import type { RouteTransitionResult } from './props'
import { bindRouterFlow } from './router-instance'
import { isNativeActivityBackEvent, registerNativeBackHandler } from './native-back-dispatcher'

type Shown = Awaited<ReturnType<RouterModalSurface['show']>>
/** SDK surface lifecycle is separate from renderer receipts and routed history. */
function nativeSurface(
	request: RouterModalSurfaceRequest,
	presenter: any,
	timeout: number,
): RouterModalSurface {
	const native = new GridLayout()
	const unbindTheme = applyThemeClasses(native, 'vx-modal-host')
	let themeBound = true
	const releaseTheme = () => {
		if (!themeBound) {
			return
		}
		themeBound = false
		unbindTheme()
	}
	let started = false
	let nativeShown = false
	let closed = false
	let disposed = false
	let closeRequested = false
	let showSettled = false
	let closeSettled = false
	let showTimer: ReturnType<typeof setTimeout> | undefined
	let closeTimer: ReturnType<typeof setTimeout> | undefined
	let resolveShown!: (result: Shown) => void
	let rejectShown!: (error: unknown) => void
	let resolveClosed!: () => void
	let rejectClosed!: (error: unknown) => void
	const shown = new Promise<Shown>((resolve, reject) => {
		resolveShown = resolve
		rejectShown = reject
	})
	const closure = new Promise<void>((resolve, reject) => {
		resolveClosed = resolve
		rejectClosed = reject
	})
	// Native callbacks may arrive before the router starts awaiting a receipt.
	void shown.catch(() => {})
	void closure.catch(() => {})
	const root = request.owner.createRoot(native, request.onOwnerDisposed)
	const transition = request.route.transition
	const skipped = request.transition?.kind === 'skip'
	const reduced = readNativeReducedMotion()
	const effects = createPaneRouteTransitions()
	const animated = !skipped && !reduced && (transition === undefined || transition === 'default')
	const finished: RouteTransitionResult = animated
		? { status: 'completed' }
		: {
				status: 'skipped',
				reason:
					skipped || transition === 'none'
						? 'disabled'
						: reduced
							? 'reduced-motion'
							: 'unsupported',
			}
	const settleShown = (result: Shown) => {
		if (showSettled) {
			return
		}
		showSettled = true
		clearTimeout(showTimer)
		resolveShown(result)
	}
	const cleanup = () => {
		effects.interrupt()
		clearTimeout(showTimer)
		clearTimeout(closeTimer)
		native.off('shownModally', onShown)
		native.off('closedModally', onClosed)
		root.unmount()
		releaseTheme()
	}
	const onShown = () => {
		nativeShown = true
		settleShown({
			status: 'shown',
			finished:
				!animated && transition && transition !== 'default' && !closeRequested && !disposed
					? effects.run(request.context, transition, request.transition, native)
					: Promise.resolve(finished),
		})
		if (closeRequested) {
			invokeClose()
		}
	}
	const onClosed = () => {
		if (closed) {
			return
		}
		closed = true
		settleShown({ status: 'closed' })
		if (!closeSettled) {
			closeSettled = true
			resolveClosed()
		}
		cleanup()
		request.onClosed()
	}
	let closingNative = false
	const invokeClose = () => {
		if (closed || closingNative || !nativeShown) {
			return
		}
		closingNative = true
		try {
			native.closeModal()
		} catch (error) {
			closingNative = false
			if (!closeSettled) {
				closeSettled = true
				rejectClosed(error)
			}
		}
	}
	native.on('shownModally', onShown)
	native.on('closedModally', onClosed)
	return {
		native,
		root,
		show() {
			if (disposed || closed) {
				return Promise.resolve({ status: 'closed' })
			}
			if (started) {
				return shown
			}
			started = true
			showTimer = setTimeout(() => {
				if (!showSettled) {
					showSettled = true
					rejectShown(new Error('Native modal presentation did not complete'))
				}
			}, timeout)
			try {
				// Direct SDK cancellation cannot await route admission. Canonical dismiss
				// and the claimed Android Back path prepare the presenter first.
				presenter.showModal(native, { context: {}, fullscreen: true, cancelable: false, animated })
			} catch (error) {
				clearTimeout(showTimer)
				if (!showSettled) {
					showSettled = true
					rejectShown(error)
				}
			}
			return shown
		},
		async close() {
			if (closed) {
				return
			}
			if (!started) {
				closed = true
				settleShown({ status: 'closed' })
				if (!closeSettled) {
					closeSettled = true
					resolveClosed()
				}

				cleanup()
				return
			}
			if (!closeRequested) {
				closeRequested = true
				effects.interrupt()
				closeTimer = setTimeout(() => {
					if (!closeSettled) {
						closeSettled = true
						rejectClosed(new Error('Native modal dismissal did not complete'))
					}
				}, timeout)

				// Do not start another UIKit/fragment transaction during presentation.
				await shown.catch(() => {})
				invokeClose()
			}
			return closure
		},
		dispose() {
			if (disposed) {
				return
			}
			disposed = true
			effects.interrupt()
			releaseTheme()
			root.unmount()
			if (!started || closed) {
				cleanup()
				settleShown({ status: 'closed' })
				if (!closeSettled) {
					closeSettled = true
					resolveClosed()
				}
			} else {
				// Accepted SDK work can report late. Keep lifecycle listeners so a
				// late shown event still closes the native surface rather than reviving it.
				closeRequested = true
				void shown.catch(() => {}).then(invokeClose)
			}
		},
	}
}

/** One window's native Frame and pane histories plus owner-preserving modals.
 * No nested native Frame is created inside the modal. */
export function createNativeModalRouterHost(
	options: Parameters<typeof createNativeRouterHost>[0] & {
		modalTimeoutMs?: number
		/** Explicit Frame flows; other flows render inside their declaring pane. */
		frameFlows?: readonly string[]
		onCleanupError?(error: unknown): void
	},
) {
	const timeout = options.modalTimeoutMs ?? 15000
	if (!Number.isFinite(timeout) || timeout <= 0) {
		throw new TypeError('Expected a positive modal timeout')
	}
	const activeFlows = new Map<string, { active: boolean; order: number }>()
	let activationOrder = 0
	let instanceDisposed = false
	const base = createPaneRouterHost({
		frames: createNativeRouterHost({
			...options,
			isFlowActive: (flow) =>
				options.isFlowActive?.(flow) ?? (flow === 'root' || activeFlows.get(flow)?.active === true),
		}),
		frameFlows: options.frameFlows,
		isFrameFlow: options.frameFlows ? undefined : (flow) => !!options.getFrame(flow),
	})
	const platform = createModalRouterHost({
		base,
		onCleanupError: options.onCleanupError,
		createSurface(request) {
			const presenter =
				request.presenter?.native ??
				modalPresenter(
					request.owner.host?.page?.frame ??
						options.getFrame(request.presenterFlow) ??
						options.getFrame('root'),
				)
			if (!presenter) {
				return undefined
			}
			return nativeSurface(request, presenter, timeout)
		},
	})
	const token = {}
	let detachBack = () => {}
	let detachPaneBack = () => {}
	const dispose = platform.host.dispose
	platform.host.dispose = () => {
		instanceDisposed = true
		detachPaneBack()
		activeFlows.clear()
		detachBack()
		dispose?.()
	}
	return {
		...platform,
		setFlowActive(flow: string, active: boolean) {
			activeFlows.set(flow, { active, order: ++activationOrder })
		},
		attach(router: Parameters<typeof platform.attach>[0]) {
			platform.attach(router)
			detachPaneBack = registerNativeBackHandler(
				{},
				{
					priority: -10,
					handle(event) {
						if (instanceDisposed || !event.activity || !isNativeActivityBackEvent(event)) {
							return false
						}
						if (options.getFrame('root')?.android?.activity !== event.activity) {
							return false
						}
						for (const [flow, state] of [...activeFlows].sort(
							([, a], [, b]) => b.order - a.order,
						)) {
							if (!state.active || flow === 'root' || !platform.host.getSnapshot(flow).canGoBack) {
								continue
							}

							void bindRouterFlow(router, flow)
								.back()
								.catch(() => console.warn('[octane-xplat] Pane Back failed'))

							return true
						}
						return false
					},
				},
			)

			detachBack = registerNativeBackHandler(token, {
				priority: 50,
				handle(event) {
					const modals = platform.modals.getSnapshot()
					const top = modals.at(-1)
					if (!top) {
						return false
					}
					const surface = platform.getSurface(top.flow)
					if (!surface || (!isNativeActivityBackEvent(event) && event.object !== surface.native)) {
						return false
					}
					let rootFlow = top.presenterFlow
					while (true) {
						const parent = modals.find((modal) => modal.flow === rootFlow)
						if (!parent) {
							break
						}

						rootFlow = parent.presenterFlow
					}
					if (
						!event.activity ||
						(options.getFrame(rootFlow) ?? options.getFrame('root'))?.android?.activity !==
							event.activity
					) {
						return false
					}
					const state = platform.host.getSnapshot(top.flow)
					// Consume during presentation/teardown; never start a competing
					// SDK transaction while an accepted one is completing.
					if (!state.route || state.disposed) {
						return true
					}
					const modal = bindRouterFlow(router, top.flow)
					void (state.canGoBack ? modal.back() : modal.dismiss()).catch(() => {
						console.warn('[octane-xplat] Routed modal Back failed')
					})
					return true
				},
			})
		},
		getModalView(flow: string) {
			return platform.getSurface(flow)?.native as GridLayout | undefined
		},
	}
}
