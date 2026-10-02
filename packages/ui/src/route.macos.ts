import { createNavigationRequests, type NavigationRequest } from './navigation-request'
import { useSyncExternalStore } from 'octane'
import type { Route, RouteHead, RouteManifest, RouteMeta, ScreenTable } from './props'
import {
	buildRoutePath,
	layoutChain,
	matchUrl,
	mergeRouteManifests,
	RouteRedirect,
} from './route-table'

const navigationRequests = createNavigationRequests()

// Effective tables = the file-derived base manifest merged under every
// addRoutes layer, matching the web/native leaves' registry split.
let baseManifest: RouteManifest = { screens: {}, routes: [], layouts: {} }
const dynamicManifests: RouteManifest[] = []
let screens: ScreenTable = {}
let routes: RouteMeta[] = []
let routeLayouts: Record<string, any> = {}
let routeLoaders: NonNullable<RouteManifest['loaders']> = {}
const stacks = new Map<string, Route[]>()
const listeners = new Set<() => void>()
let lastStack = 'root'
let modalRoute: Route | null = null

const emit = () => listeners.forEach((listener) => listener())
const subscribe = (listener: () => void) => {
	listeners.add(listener)
	return () => listeners.delete(listener)
}

function rebuildRegistry(): void {
	const merged = mergeRouteManifests(baseManifest, ...dynamicManifests)
	screens = merged.screens
	routes = merged.routes
	routeLayouts = merged.layouts
	routeLoaders = merged.loaders ?? {}
	emit()
}

export function registerScreens(table: ScreenTable, manifest: RouteMeta[] = []): void {
	baseManifest = { ...baseManifest, screens: table, routes: manifest }
	rebuildRegistry()
}

export function registerRoutes(manifest: RouteManifest): void {
	baseManifest = manifest
	rebuildRegistry()
}

/** Layer a programmatic manifest (from `defineRoutes`) over the registered
 *  routes — same-name entries win over the base with a warn. Registered
 *  layers survive later registerRoutes re-registration. */
export function addRoutes(manifest: RouteManifest): void {
	dynamicManifests.push(manifest)
	rebuildRegistry()
}

export function screenFor(name: string): ScreenTable[string] | undefined {
	return screens[name]
}

export function layoutsFor(name: string): any[] {
	return layoutChain(routeLayouts, name)
}

function routeAt(stack: string): Route | null {
	const entries = stacks.get(stack)
	return entries?.[entries.length - 1] ?? null
}

export function routeFor(stack: string): Route | null {
	return routeAt(stack)
}

export function currentRoute(): Route | null {
	return routeAt(lastStack)
}

export function currentModalRoute(): Route | null {
	return modalRoute
}

export function routeStacks(): string[] {
	return [...stacks.keys()].filter((name) => (stacks.get(name)?.length ?? 0) > 0)
}

export function canGoBack(stack = 'root'): boolean {
	return modalRoute !== null || (stacks.get(stack)?.length ?? 0) > 1
}

export function useCanGoBack(stack = 'root'): boolean {
	return useSyncExternalStore(subscribe, () => canGoBack(stack))
}

export function useRoute(stack = 'root'): Route | null {
	return useSyncExternalStore(subscribe, () => routeAt(stack))
}

export function useModalRoute(): Route | null {
	return useSyncExternalStore(subscribe, currentModalRoute)
}

function metaFor(name: string): RouteMeta | undefined {
	return routes.find((meta) => meta.name === name)
}

function contextFor(route: Route): Record<string, unknown> {
	return route.context ?? {}
}

async function prepareRoute(
	route: Route,
	request: NavigationRequest,
	redirects = 0,
): Promise<void> {
	if (!request.isCurrent()) {
		return
	}
	if (!request.claim(route.stack)) {
		return
	}

	const beforeLoad = metaFor(route.name)?.beforeLoad
	if (!beforeLoad) {
		commitRoute(route, request)
		return
	}

	if (redirects > 16) {
		console.warn(`[octane-xplat] beforeLoad redirect loop for '${route.name}'`)
		return
	}

	try {
		const returned = await beforeLoad({ params: route.params, context: contextFor(route) })
		commitRoute(
			{ ...route, context: returned ? { ...contextFor(route), ...returned } : route.context },
			request,
		)
	} catch (error) {
		if (!request.isCurrent()) {
			return
		}
		if (error instanceof RouteRedirect) {
			await prepareRoute(error.route, request, redirects + 1)
			return
		}

		console.warn(
			`[octane-xplat] beforeLoad('${route.name}') rejected: ${(error as Error)?.message ?? error}`,
		)
	}
}

export function redirect(route: Route): never {
	throw new RouteRedirect(route)
}

export function pushRoute(route: Route): void {
	const request = navigationRequests.begin(route.stack)
	if (metaFor(route.name)?.beforeLoad) {
		void prepareRoute(route, request)
		return
	}

	commitRoute(route, request)
}

function commitRoute(route: Route, request: NavigationRequest): void {
	if (!request.isCurrent()) {
		return
	}
	const entry = { ...route, presentation: route.presentation ?? metaFor(route.name)?.presentation }
	const loader = routeLoaders[entry.name] ?? metaFor(entry.name)?.loader
	if (
		loader &&
		!Object.prototype.hasOwnProperty.call(entry, 'loaderData') &&
		!Object.prototype.hasOwnProperty.call(entry, 'loaderError')
	) {
		void Promise.resolve()
			.then(() => loader(entry.params))
			.then(
				(loaderData) => commitRoute({ ...entry, loaderData }, request),
				(loaderError) => commitRoute({ ...entry, loaderError }, request),
			)

		return
	}

	if (entry.presentation === 'modal') {
		modalRoute = entry
	} else {
		const stack = stacks.get(entry.stack) ?? []
		stacks.set(entry.stack, [...stack, entry])
		lastStack = entry.stack
		modalRoute = null
	}

	emit()
}

export function popRoute(stack = 'root'): void {
	navigationRequests.invalidate(stack)
	if (modalRoute) {
		navigationRequests.invalidate(modalRoute.stack)
		modalRoute = null
	} else {
		const entries = stacks.get(stack) ?? []
		if (entries.length > 1) {
			stacks.set(stack, entries.slice(0, -1))
		} else if (entries.length) {
			stacks.set(stack, [])
		}

		lastStack = stack
	}

	emit()
}

export function pushDeepLink(url: string): void {
	const route = matchUrl(routes, url)
	if (route) {
		pushRoute(route)
	}
}

export function hrefFor(route: Route): string {
	return buildRoutePath(routes, route)
}

export function addBackInterceptor(_handler: () => boolean): () => void {
	console.warn('[octane-xplat] addBackInterceptor is unsupported on the AppKit target.')
	return () => {}
}

export function useRouteHead(_route: Route | null): RouteHead | undefined {
	return undefined
}
