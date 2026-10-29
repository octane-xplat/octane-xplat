import { createBrowserRouterHost } from './browser-router-host.web'
import { createDefaultRouterRuntime } from './default-router-runtime'
import type {
	DefaultRouterContractCheck,
	RouteManifest,
	RouterConfiguration,
	RouterInstance,
} from '../props'

export const defaultRouterRuntime = createDefaultRouterRuntime(createBrowserRouterHost)
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

/** Prepare once for a mounted root lifetime through the ordinary CSR path.
 * Defer until layout effects mount the host; cleanup prevents a queued boot
 * from starting after that owner has ended. */
export function startDefaultBrowserRouter(): () => void {
	let active = true
	let started = false
	let stop = () => {}
	const check = () => {
		if (!active || started) {
			return
		}
		void Promise.resolve()
			.then(async () => {
				if (!active || started) {
					return
				}
				const state = router.getSnapshot()
				if (state.navigation.status === 'pending') {
					return
				}
				started = true
				stop()
				if (state.route) {
					return
				}
				await router.navigateUrl(location.pathname + location.search + location.hash, {
					replace: true,
				})
			})
			.catch(() => console.warn('[octane-xplat] Initial client navigation failed'))
	}
	// Owner replacement can cancel an old request asynchronously. Observe its
	// settlement so the new lifetime cannot miss its one startup preparation.
	stop = router.subscribe(check)
	check()
	return () => {
		active = false
		stop()
	}
}
