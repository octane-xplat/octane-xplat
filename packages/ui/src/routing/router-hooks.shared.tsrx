import { createNavigationBlocker, registerNavigationBlocker } from './navigation-blocker'
// Renderer-neutral providers: no native or DOM elements. A distinct shared
// basename prevents platform moduleSuffixes from resolving a leaf to itself.
import { readRouterMatch } from './router-instance'
import { createSearchUpdater } from './route-search-updater'
import { useContext, useLayoutEffect, useMemo, useSyncExternalStore } from 'octane'
import {
	createRouterRenderScope,
	requireRouterRenderScope,
	type RouterRenderScope,
} from './router-render-scope'

import type {
	NavigationBlockerOptions,
	NavigationBlockerState,
	RegisteredRouteContracts,
	RouteApi,
	RouterMatch,
	RouterInstance,
	RouterNavigator,
	RouterProviderProps,
	RouterState,
	RouterNavigationState,
} from '../props'

import { RouterScopeContext as ScopeContext } from './router-hook-context'
const Provider: any = ScopeContext

/** Internal entry boundary, also used for retained native Pages and portals. */
export function RouterRenderScopeProvider(props: {
	scope: RouterRenderScope
	children?: any
}): any {
	const parent = useContext(ScopeContext)
	const scope = useMemo(
		() => ({
			...props.scope,
			host:
				props.scope.host ?? (parent?.instance === props.scope.instance ? parent.host : undefined),
		}),
		[props.scope, parent],
	)

	return <Provider value={scope}>{props.children}</Provider>
}

/** Bind an explicitly owned instance to a rendering tree. The caller owns its
 * lifetime; unmounting one provider must not dispose another tree's router. */
export function RouterProvider<Contracts, Stacks extends string, Transitions extends string>(
	props: RouterProviderProps<Contracts, Stacks, Transitions>,
): any {
	const scope = useMemo(
		() => createRouterRenderScope(props.router, props.stack ?? 'root'),
		[props.router, props.stack],
	)

	return <RouterRenderScopeProvider scope={scope}>{props.children}</RouterRenderScopeProvider>
}

function useScope(instance?: object, declared = false): RouterRenderScope {
	const scope = useContext(ScopeContext)
	return requireRouterRenderScope(scope, instance, declared)
}

/** Navigator for the rendering flow's router, or for a declared instance.
 *  Throws outside a router scope. */
export function useRouter(): RouterNavigator<RegisteredRouteContracts>
export function useRouter<Contracts, Stacks extends string, Transitions extends string>(
	instance: RouterInstance<Contracts, Stacks, Transitions>,
): RouterNavigator<Contracts, Stacks, Transitions>

export function useRouter(instance?: object): RouterNavigator<any, string> {
	return useScope(instance, true).navigator
}

function useSnapshot(instance?: object, declared = false): RouterState<any> {
	const { navigator } = useScope(instance, declared)
	return useSyncExternalStore(navigator.subscribe, navigator.getSnapshot, navigator.getSnapshot)
}

/** Reactive router state — current match, navigation status, history flags. */
export function useRouterState(): RouterState<RegisteredRouteContracts>
export function useRouterState<Contracts, Stacks extends string>(
	instance: RouterInstance<Contracts, Stacks, any>,
): RouterState<Contracts>

export function useRouterState(instance?: object): RouterState<any> {
	return useSnapshot(instance, true)
}

/** Reactive loading and failure feedback for the rendering flow. No route DTO
 * is exposed, so a reusable status component may inherit a custom provider.
 * @example
 * import { useNavigation } from '@octane-xplat/ui/routing'
 * const state = useNavigation()
 * if (state.status === 'failed') console.error(state.result.status)
 */
export function useNavigation(): RouterNavigationState
export function useNavigation<C, S extends string, T extends string>(
	instance: RouterInstance<C, S, T>,
): RouterNavigationState

export function useNavigation(instance?: object): RouterNavigationState {
	return useSnapshot(instance).navigation
}

/** Confirm navigation from this rendering entry without exposing route DTOs.
 * Retained older entries stay subscribed but cannot block the current one.
 * @example
 * import { useNavigationBlocker } from '@octane-xplat/ui/routing'
 * const blocker = useNavigationBlocker({ when: hasUnsavedChanges })
 * if (blocker.status === 'blocked') blocker.reset()
 */
export function useNavigationBlocker(options: NavigationBlockerOptions): NavigationBlockerState {
	const { instance, navigator, match } = useScope()
	const blocker = useMemo(createNavigationBlocker, [navigator, match])
	useLayoutEffect(
		() =>
			registerNavigationBlocker(navigator, {
				blocker,
				shouldBlock() {
					if (!options.when) {
						return false
					}

					const rendering = match.getSnapshot()
					const projected = rendering ? readRouterMatch(instance, rendering) : null
					return projected === navigator.getSnapshot().route
				},
			}),
		[blocker, instance, navigator, match, options.when],
	)

	return useSyncExternalStore(blocker.subscribe, blocker.getSnapshot, blocker.getSnapshot)
}

/** Reactive Back availability for the rendering flow. */
export function useCanGoBack(): boolean {
	return useSnapshot().canGoBack
}

/** Current rendering match — params, search, and loader data; null outside a match. */
export function useRouteMatch(): RouterMatch<RegisteredRouteContracts> | null
export function useRouteMatch<Contracts, Stacks extends string>(
	instance: RouterInstance<Contracts, Stacks, any>,
): RouterMatch<Contracts> | null

export function useRouteMatch(instance?: object): any {
	const { match, instance: owner } = useScope(instance, true)
	const value = useSyncExternalStore(match.subscribe, match.getSnapshot, match.getSnapshot)
	return value ? readRouterMatch(owner, value) : null
}

/** Route-specific reads check the rendering match, rather than an application
 * global. Supplying an instance infers its isolated catalog and checks identity;
 * ordinary generated apps use the one-argument form. */
export function getRouteApi<Name extends keyof RegisteredRouteContracts & string>(
	to: Name,
): RouteApi<RegisteredRouteContracts, Name>

export function getRouteApi<
	Contracts,
	Name extends keyof Contracts & string,
	Stacks extends string,
>(to: Name, instance: RouterInstance<Contracts, Stacks, any>): RouteApi<Contracts, Name>

export function getRouteApi(to: string, instance?: object): RouteApi<any, string> {
	function useMatch(): any {
		const { match, instance: owner } = useScope(instance, true)
		const value = useSyncExternalStore(match.subscribe, match.getSnapshot, match.getSnapshot)
		if (!value || value.to !== to) {
			throw new Error(`Route '${to}' is not the rendering match`)
		}

		const declared = readRouterMatch(owner, value)
		if (declared.contract !== 'declared') {
			throw new Error(`Route '${to}' has no declared contract in this router instance`)
		}

		return declared
	}

	return {
		useMatch,
		useParams: () => useMatch().params,
		useSearch: () => useMatch().search,
		useLoaderData: () => useMatch().data,
		useContext: () => useMatch().context,
		useUpdateSearch: () => {
			const { instance: owner, navigator } = useScope(instance, true)
			const match = useMatch()
			return useMemo(() => createSearchUpdater(owner, navigator, match), [owner, navigator, match])
		},
	}
}
