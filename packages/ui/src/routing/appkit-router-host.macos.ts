import { createPaneRouterHost } from './pane-router-host'
import { createAppKitRouteTransitions } from './appkit-route-transition.macos'
import {
	createModalRouterHost,
	type RouterModalSurface,
	type RouterModalSurfaceRequest,
} from './modal-router-host'

import { bindRouterFlow } from './router-instance'
import type { ContentRoot, ContentOwner } from '../components/overlays/owned-content'
import type { RouterHost, RouterInstance, Store } from '../props'
import type { RenderRouterHost } from './render-router-host'
import type { RouterRenderScope } from './router-render-scope'

interface AppKitSurface {
	readonly panel: unknown
	readonly closed: boolean
	readonly closedPromise: Promise<unknown>
	show(): void
	close(reason?: string): void
}

interface AppKitPresentation {
	presentSurface(options: {
		owner: unknown
		kind: 'dialog'
		modal: true
		fullscreen: true
		deferPresentation: true
		label: string
		component(): null
		createContentRoot(target: unknown): ContentRoot
		canDismiss(path: string): false
	}): AppKitSurface
}

/** One declaring AppKit window; route history/ownership stay in the shared host. */
export function createAppKitRouterHost(): {
	attach(router: Parameters<(router: RouterInstance<any, any, any>) => void>[0]): void
	host: RouterHost
	scope(flow: string): RouterRenderScope
	mount(flow: string, owner: ContentOwner): () => void | Promise<void>
	getRenderHost?(flow: string): RenderRouterHost | undefined
	isModalFlow?(flow: string): boolean
	setFlowActive?(flow: string, active: boolean): void
	modals: Store<
		readonly {
			flow: string
			presenterFlow: string
		}[]
	>
	getSurface(flow: string): RouterModalSurface | undefined
} {
	let instance: RouterInstance<any> | undefined
	const platform = createModalRouterHost({
		base: createPaneRouterHost(),
		createSurface(request: RouterModalSurfaceRequest) {
			const owner = request.owner.host
			const bridge = (globalThis as { __xplatAppKit?: AppKitPresentation }).__xplatAppKit
			if (!owner?.window || !bridge?.presentSurface) {
				return undefined
			}
			let root: ContentRoot | undefined
			let content: unknown
			let disposed = false
			const effects = createAppKitRouteTransitions()
			const surface = bridge.presentSurface({
				owner,
				kind: 'dialog',
				modal: true,
				fullscreen: true,
				deferPresentation: true,
				label: 'Route dialog',
				component: () => null,
				createContentRoot(target) {
					content = target
					return (root = request.owner.createRoot(target, request.onOwnerDisposed))
				},
				canDismiss() {
					// Escape/outside dismissal cannot close before asynchronous admission.
					if (!disposed && instance) {
						void bindRouterFlow(instance, request.flow)
							.dismiss()
							.catch(() => {
								console.warn('[octane-xplat] AppKit routed dismissal failed')
							})
					}
					return false
				},
			})
			if (!root || typeof surface.show !== 'function') {
				surface.close()
				throw new Error('AppKit routed modals require an owned, deferred presentation surface')
			}
			const ownedRoot = root
			void surface.closedPromise.then(request.onClosed)
			return {
				native: surface.panel,
				root: ownedRoot,
				async show() {
					if (disposed || surface.closed) {
						return { status: 'closed' as const }
					}
					surface.show()
					const finished = effects.run(
						request.context,
						request.route.transition,
						request.transition,
						content,
					)
					return { status: 'shown' as const, finished }
				},
				async close() {
					effects.interrupt()
					surface.close()
					await surface.closedPromise
				},
				dispose() {
					if (disposed) {
						return
					}
					disposed = true
					effects.interrupt()
					surface.close()
					ownedRoot.unmount()
				},
			}
		},
	})
	const dispose = platform.host.dispose
	platform.host.dispose = () => {
		instance = undefined
		dispose?.()
	}
	return {
		...platform,
		attach(router: RouterInstance<any, any, any>): void {
			platform.attach(router)
			instance = router
		},
	}
}
