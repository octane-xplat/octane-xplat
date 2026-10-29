import { createClientRouteEntry } from './client-route-entry'
import { createRouterRenderScope } from './router-render-scope'
import { createStore } from '../data/store'
import type { BrowserRouteSnapshot } from './browser-router-host.web'
import type { PreparedRouteMatch, RouterHost, RouterHostContent, RouterInstance } from '../props'

/** Request-local, read-only counterpart of the browser outlet. No browser globals
 * and no process-global router; both compilers render exactly the same tree. */
export function createServerRouterHost() {
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
		attach(router: RouterInstance<any>) {
			if (instance) {
				throw new Error('Server router host is already attached')
			}
			instance = router
		},
		initialize(route: PreparedRouteMatch, content: RouterHostContent) {
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
		assertRendered() {
			if (failed) {
				throw failure
			}
		},
		scope(flow: string) {
			if (!instance) {
				throw new Error('Server router host is not attached')
			}
			return createRouterRenderScope(instance, flow)
		},
		mount: (_flow: string) => () => {},
		entryElement: (_id: string, _element: HTMLElement | null) => {},
	}
}
