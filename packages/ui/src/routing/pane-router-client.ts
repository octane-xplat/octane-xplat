import { createPaneRouterHost as createPlatformPaneHost } from './pane-router-host'
import { routerUsesHost } from './router-instance'
import type { PaneRouterHost, RouterHost, RouterInstance, Store } from '../props'
import type { ContentEntry, ContentRoot } from '../components/overlays/owned-content'
import type { RenderRouteFlow } from './render-router-host'
import type { RouterRenderScope } from './router-render-scope'

export type PaneRouterClient = {
	host: RouterHost
	attach(router: RouterInstance<any, any, any>): void
	scope(flow: string): RouterRenderScope
	getRenderHost(flow: string):
		| {
				host: RouterHost
				views: Store<ReadonlyMap<string, RenderRouteFlow>>
				attach(router: RouterInstance<any>): void
				scope(flow: string): RouterRenderScope
				mount(
					flow: string,
					options?: {
						modal?: boolean
						views?: ReadonlyMap<string, unknown>
					},
				): () => void
		  }
		| undefined
	mount(
		flow: string,
		owner: {
			entries: Store<ContentEntry[]>
			readonly disposed: boolean
			host: {
				page?: any
				parent?: any
				window?: any
			} | null
			createRoot(target: unknown, onOwnerDispose?: () => void): ContentRoot
			dispose(): void
		},
	): () => void | Promise<void>
}

const hosts = new WeakMap<PaneRouterHost, ReturnType<typeof createPlatformPaneHost>>()

/** Create independent retained-pane histories without changing browser URLs,
 * creating native Frames or presenting modals. Attach the instance before
 * mounting RouterPane. Motion reports skipped; the enclosing host owns OS Back
 * and window-close integration. The instance creator owns disposal.
 * @example
 * import { createPaneRouterHost, createRouter, defineRoute, defineRoutes } from '@octane-xplat/ui/routing'
 * const host = createPaneRouterHost()
 * const navigation = createRouter({ host: host.host,
 *   catalog: defineRoutes([defineRoute({ path: '/help' }).screen(() => null)]) })
 * host.attach(navigation)
 */
export function createPaneRouterHost(): PaneRouterHost {
	const platform = createPlatformPaneHost()
	// The private registry establishes original host identity; the type witness
	// prevents structural substitutes from looking like a constructed host.
	const host: PaneRouterHost = Object.freeze({
		host: platform.host,
		attach<Contracts, Stacks extends string, Transitions extends string>(
			router: RouterInstance<Contracts, Stacks, Transitions>,
		) {
			if (!routerUsesHost(router, platform.host)) {
				throw new Error('Attach the instance created with this pane host')
			}
			platform.attach(router)
		},
	}) as PaneRouterHost
	hosts.set(host, platform)
	return host
}

/** @internal Only original pane bindings may provide renderer ownership. */
export function resolvePaneRouterHost(host: PaneRouterHost): PaneRouterClient {
	const platform = hosts.get(host)
	if (!platform) {
		throw new TypeError('Use an original host from createPaneRouterHost')
	}
	return platform
}
