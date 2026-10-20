// Outlet resolution uses the declaring renderer scope or the configured client.
import { useContext } from 'octane'
import { RouterScopeContext } from './router-hook-context'
import type { ClientRouterHost, RouterInstance } from './props'

export function useRouteOutletScope(
	stack: string | undefined,
	runtime: {
		router: object
		hasStack(stack: string): boolean
		getClient(): { platform: ClientRouterHost }
	},
) {
	const scope = useContext(RouterScopeContext)
	if (scope?.host) {
		if (stack !== undefined) {
			;(scope.instance as RouterInstance<any, string>).forStack(stack)
		}

		return {
			host: scope.host,
			flow: stack ?? scope.flow,
			defaultClient: scope.instance === runtime.router,
		}
	}

	if (scope && scope.instance !== runtime.router) {
		throw new Error('This router provider has no mounted renderer host')
	}

	const flow = stack ?? 'root'
	if (!runtime.hasStack(flow)) {
		throw new Error(`Unknown router stack '${flow}'`)
	}

	return { host: runtime.getClient().platform, flow, defaultClient: true }
}
