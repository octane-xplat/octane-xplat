import { createNativeModalRouterHost } from './native-modal-router-host'
import { getStack, onStackRegistered } from '../components/layout/stacks'
import { createDefaultRouterRuntime } from './default-router-runtime'
import type {
	DefaultRouterContractCheck,
	RegisteredRouteContracts,
	RouteManifest,
	RouterConfiguration,
	RouterInstance,
	Store,
} from '../props'

import type { RouterModalSurface } from './modal-router-host'
import type { RenderRouterHost } from './render-router-host'
import type { ContentOwner } from '../components/overlays/owned-content'
import type { RouterRenderScope } from './router-render-scope'
import type { GridLayout } from '@nativescript/core'
import type { RouteTransitionName, RouterHost } from './core'

export type DefaultClientRuntime = {
	router: RouterInstance<RegisteredRouteContracts, 'root', RouteTransitionName>
	configured: Store<boolean>
	getClient: () => {
		platform: {
			setFlowActive(flow: string, active: boolean): void
			attach(router: Parameters<(router: RouterInstance<any, any, any>) => void>[0]): void
			getModalView(flow: string): GridLayout | undefined
			host: RouterHost
			scope(flow: string): RouterRenderScope
			mount(flow: string, owner: ContentOwner): () => void | Promise<void>
			getRenderHost?(flow: string): RenderRouterHost | undefined
			isModalFlow?(flow: string): boolean
			modals: Store<
				readonly {
					flow: string
					presenterFlow: string
				}[]
			>
			getSurface(flow: string): RouterModalSurface | undefined
		}
		instance: RouterInstance<RegisteredRouteContracts>
	}
	configure: (next: RouterConfiguration<RouteManifest, string>) => void
	hasStack: (stack: string) => boolean
	stackNames: () => string[]
}

export const defaultRouterRuntime: DefaultClientRuntime = createDefaultRouterRuntime(() =>
	createNativeModalRouterHost({
		getFrame: getStack,
		onFrameChange: (listener) => onStackRegistered((name) => listener(name)),
	}),
)

/** The application's typed client router. RouteOutlet supplies its owning
 * platform integration; server requests must create isolated instances. */
export const router: RouterInstance = defaultRouterRuntime.router
/** Install client definitions and context before rendering RouteOutlet.
 * Reconfiguration replaces the base contribution without removing plugins.
 * Host settings such as base/stacks require a reload after first use. */
export function configureRouter<
	const Catalog extends RouteManifest,
	const Stack extends string = never,
>(
	configuration: RouterConfiguration<Catalog, Stack> & DefaultRouterContractCheck<NoInfer<Catalog>>,
): void {
	defaultRouterRuntime.configure(configuration)
}
