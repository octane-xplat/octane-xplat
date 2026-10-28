import { bindRouterFlow, isDefaultRouter } from './router-instance'
import type { ClientRouterHost, PreparedRouteMatch, RouterInstance, RouterNavigator } from './props'

/** Renderer-owned scope. Retained entries provide their own match subscription;
 * their navigator still targets the flow that owns that entry. Never find a
 * flow by looking at the globally active tab or the newest rendered screen. */
export interface RouterRenderScope {
	readonly instance: object
	readonly flow: string
	/** Renderer ownership travels with the scope, never through a global active router. */
	readonly host?: ClientRouterHost
	readonly navigator: RouterNavigator<any, string, string>
	readonly match: {
		getSnapshot(): PreparedRouteMatch | null
		subscribe(listener: () => void): () => void
	}
}

/** Internal shared ownership check for routing hooks and composed links. */
export function requireRouterRenderScope(
	scope: RouterRenderScope | null,
	instance?: object,
	declared = false,
): RouterRenderScope {
	if (!scope) {
		throw new Error('Routing hooks require a RouterProvider or a router-owned screen')
	}
	if (instance && instance !== scope.instance) {
		throw new Error('Routing hook belongs to a different router instance')
	}
	if (declared && !instance && !isDefaultRouter(scope.instance)) {
		throw new Error(
			'Pass the explicit router instance to typed routing hooks in a custom RouterProvider',
		)
	}
	return scope
}

export function createRouterRenderScope<
	Contracts,
	Stacks extends string,
	Transitions extends string,
>(
	instance: RouterInstance<Contracts, Stacks, Transitions>,
	flow: string,
	match?: RouterRenderScope['match'],
): RouterRenderScope {
	const navigator = bindRouterFlow(instance, flow)
	return {
		instance,
		flow,
		navigator,
		match: match ?? {
			getSnapshot: () => navigator.getSnapshot().route as unknown as PreparedRouteMatch | null,
			subscribe: navigator.subscribe,
		},
	}
}
