import { createAppKitRouterHost } from './appkit-router-host.macos'
import { createDefaultRouterRuntime } from './default-router-runtime'
import type {
	DefaultRouterContractCheck,
	RouteManifest,
	RouterConfiguration,
	RouterInstance,
} from './props'

export const defaultRouterRuntime = createDefaultRouterRuntime(createAppKitRouterHost)
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
