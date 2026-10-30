import { createClientRouteEntry } from './client-route-entry'
import { createRouterRenderScope, type RouterRenderScope } from './router-render-scope'
import { createStore } from '../data/store'
import type { BrowserRouteSnapshot } from './browser-router-host.web'
import type {
	PreparedRouteMatch,
	RouterHost,
	RouterHostContent,
	RouterInstance,
	Store,
} from '../props'

/** Request-local, read-only counterpart of the browser outlet. No browser globals
 * and no process-global router; both compilers render exactly the same tree. */
export function createServerRouterHost(): {
	host: RouterHost
	views: Store<BrowserRouteSnapshot>
	attach(router: RouterInstance<any>): void
	initialize(route: PreparedRouteMatch, content: RouterHostContent): void
	assertRendered(): void
	scope(flow: string): RouterRenderScope
	mount: (_flow: string) => () => void
	entryElement: (_id: string, _element: HTMLElement | null) => void
} {
	let instance: RouterInstance<any> | undefined
	let failure: unknown
	let failed = false
	const views = createStore<BrowserRouteSnapshot>({ main: null, modals: [] })
	const host: RouterHost = {
		history: 'linear',
		canReset: false,
		getSnapshot(flow) {
			const entry = views.getSnapshot().main
			return { route: entry?.flow === flow ? entry.route : null, canGoBack: false, modal: false }
		},
		subscribe: () => () => {},
		commit: () => ({ status: 'unsupported', operation: 'server-navigation' }),
	}
	return {
		host,
		views,
		attach(router: RouterInstance<any>): void {
			if (instance) {
				throw new Error('Server router host is already attached')
			}
			instance = router
		},
		initialize(route: PreparedRouteMatch, content: RouterHostContent): void {
			if (!instance || views.getSnapshot().main) {
				throw new Error('Server route is already initialized')
			}
			const entry = createClientRouteEntry(instance, route.stack, 'initial', route, content)
			entry.failed = (error) => {
				failed = true
				failure = error
			}
			views.set({ main: entry, modals: [] })
		},
		assertRendered(): void {
			if (failed) {
				throw failure
			}
		},
		scope(flow: string): RouterRenderScope {
			if (!instance) {
				throw new Error('Server router host is not attached')
			}
			return createRouterRenderScope(instance, flow)
		},
		mount: (_flow: string) => (): void => {},
		entryElement: (_id: string, _element: HTMLElement | null): void => {},
	}
}
