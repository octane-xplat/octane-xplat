import { createNavigationRequests, type NavigationRequest } from './navigation-request'
import { useSyncExternalStore } from 'octane'

/** Web route store — the browser half of the nav contract. One linear URL
 *  stack; `stack` names the conceptual outlet ('root' covers the app, a
 *  named stack is the pane that owns it — parallel stacks map to nested
 *  routes). URL shape: /<stack>/<path>?query or /<path>?query for root,
 *  where <path> comes from the route-dir manifest — `app/demo/[id].tsrx`
 *  pushes as /demo/<id-value>. Names not in the manifest keep the legacy
 *  /<name>?params shape. Module-scope like every other store — the pane
 *  that owns `stack` subscribes with useRoute(stack) and swaps content.
 *
 *  Modal routes (presentation 'modal' — `+modal` route files or a
 *  pushRoute override) push a real URL but overlay instead of replacing:
 *  `current` keeps the underlying route, `modalRoute` carries the modal.
 *  Back (popstate or popRoute) dismisses it. */

export type { Route } from './props'
import type { Route, RouteHead, RouteManifest, RouteMeta, ScreenTable } from './props'
import {
	buildRoutePath,
	layoutChain,
	linkPath,
	matchUrl,
	mergeRouteManifests,
	RouteRedirect,
} from './route-table'

// ---------- screen registry ----------

const navigationRequests = createNavigationRequests()

// Effective tables = the file-derived base manifest merged under every
// addRoutes layer. Keeping the split means an HMR re-run of routes.gen.*
// (registerRoutes again) can't wipe routes an app added at runtime.
let baseManifest: RouteManifest = { screens: {}, routes: [], layouts: {} }
const dynamicManifests: RouteManifest[] = []
let screens: ScreenTable = {}
let routes: RouteMeta[] = []
let routeLayouts: Record<string, any> = {}
let routeLoaders: NonNullable<RouteManifest['loaders']> = {}

function rebuildRegistry(): void {
	const merged = mergeRouteManifests(baseManifest, ...dynamicManifests)
	screens = merged.screens
	routes = merged.routes
	routeLayouts = merged.layouts
	routeLoaders = merged.loaders ?? {}
	// Registration can land after the first lazy parse (deep link read
	// before the routes module ran) — re-parse with patterns present.
	if (current !== undefined) {
		restoreRouteState()
		emit()
	}
}

/** Register the app's name → screen table. On web the table feeds
 *  `screenFor` — the fallback outlet resolution in Tabs when no
 *  `resolveScreen` prop is given; on native `pushRoute` resolves
 *  `route.name` through it. `manifest` (from deriveRouteManifest) enables
 *  path-param matching — call once from the shared routes module. */
export function registerScreens(table: ScreenTable, manifest?: RouteMeta[]): void {
	baseManifest = { ...baseManifest, screens: table, routes: manifest ?? [] }
	rebuildRegistry()
}

/** One-call registration for route-dir apps — screens + URL patterns +
 *  layouts all come from deriveRouteManifest. */
export function registerRoutes(manifest: RouteManifest): void {
	baseManifest = manifest
	rebuildRegistry()
	read()
	applyHead(modalRoute ?? current ?? null)
}

/** Layer a programmatic manifest (from `defineRoutes`) over the registered
 *  routes — same-name entries win over the base with a warn, so a host
 *  framework can override a file route deliberately. Registered layers
 *  survive later registerRoutes re-registration (e.g. routes.gen HMR). */
export function addRoutes(manifest: RouteManifest): void {
	dynamicManifests.push(manifest)
	rebuildRegistry()
	read()
	applyHead(modalRoute ?? current ?? null)
}

export function screenFor(name: string): ScreenTable[string] | undefined {
	return screens[name]
}

/** Directory layouts wrapping a route, outermost → innermost — outlets
 *  wrap their resolved element with these (`_layout.tsrx` files). */
export function layoutsFor(name: string): any[] {
	return layoutChain(routeLayouts, name)
}

export { layoutsFor as layoutsForRoute }

// ---------- the store ----------

const listeners = new Set<() => void>()
// Lazy — the manifest registers after this module evaluates, and parse()
// needs its patterns for path params.
let current: Route | null | undefined
let modalRoute: Route | null = null
let historyDepth = history.state?.__octaneXplatDepth ?? 0

// History stores an identity rather than loader results: loaders may return
// values that structured clone cannot serialize. Retain the prepared route
// for this document's back/forward traversal; fresh boots still parse the URL.
const historyRoutes = new Map<string, { current: Route | null; modal: Route | null }>()
const historyEntryPrefix = Math.random().toString(36).slice(2)
let nextHistoryEntry = 0

function rememberRouteState(entry = historyEntryPrefix + ':' + ++nextHistoryEntry): string {
	historyRoutes.set(entry, { current: current ?? null, modal: modalRoute })
	return entry
}

function restoreRouteState(): void {
	const saved = historyRoutes.get(history.state?.__octaneXplatEntry)
	if (saved) {
		current = saved.current
		modalRoute = saved.modal
	} else {
		const route = parse()
		modalRoute = route?.presentation === 'modal' ? route : null
		current = modalRoute ? null : route
		if (route) {hydrateRoute(route)}
	}
}

// Direct URLs and history entries from a previous document have no prepared
// loader result. Run their loader without pushing another history entry or
// changing the documented bootstrap guard boundary.
function hydrateRoute(route: Route): void {
	const loader = routeLoaders[route.name] ?? metaFor(route.name)?.loader
	if (!loader || Object.prototype.hasOwnProperty.call(route, 'loaderData') ||
		Object.prototype.hasOwnProperty.call(route, 'loaderError')) {return}

	const finish = (result: Pick<Route, 'loaderData' | 'loaderError'>) => {
		const prepared = { ...route, ...result }
		let changed = false
		if (current === route) { current = prepared; changed = true }
		if (modalRoute === route) { modalRoute = prepared; changed = true }
		for (const saved of historyRoutes.values()) {
			if (saved.current === route) {saved.current = prepared}
			if (saved.modal === route) {saved.modal = prepared}
		}

		if (changed) {emit()}
	}

	void Promise.resolve().then(() => loader(route.params)).then(
		(loaderData) => finish({ loaderData }),
		(loaderError) => finish({ loaderError }),
	)
}

const ROUTE_HEAD_ATTR = 'data-octane-xplat-route-head'

// Scroll positions keyed by URL — restored on popstate (native keeps
// stack pages alive, so only the web leaf needs this). `lastKey` is the
// outgoing URL: popstate fires after location already changed, so the
// saved position must be written under the URL we just left.
const scrollPositions = new Map<string, number>()
let lastKey = location.pathname + location.search
const scrollKey = () => location.pathname + location.search
const saveScroll = () => scrollPositions.set(lastKey, window.scrollY)
const restoreScroll = () => {
	const y = scrollPositions.get(scrollKey())
	if (y !== undefined) {
		requestAnimationFrame(() => window.scrollTo(0, y))
	}
}

function parse(): Route | null {
	return matchUrl(routes, location.pathname + location.search)
}

function read(): Route | null {
	if (current === undefined) {
		restoreRouteState()
	}

	return current
}

function emit() {
	listeners.forEach((l) => l())
}

function metaFor(name: string): RouteMeta | undefined {
	return routes.find((meta) => meta.name === name)
}

function headFor(r: Route | null): RouteHead | undefined {
	const head = r ? metaFor(r.name)?.head : undefined
	return typeof head === 'function' ? head(r?.params ?? {}) : head
}

function applyHead(r: Route | null): void {
	if (typeof document === 'undefined') {
		return
	}

	const head = headFor(r)
	if (!head) {
		document.querySelectorAll(`meta[${ROUTE_HEAD_ATTR}]`).forEach((node) => node.remove())
		return
	}

	if (head.title !== undefined) {
		document.title = head.title
	}

	document.querySelectorAll(`meta[${ROUTE_HEAD_ATTR}]`).forEach((node) => node.remove())
	for (const [name, content] of Object.entries(head.meta ?? {})) {
		const tag = document.createElement('meta')
		tag.setAttribute('name', name)
		tag.setAttribute('content', content)
		tag.setAttribute(ROUTE_HEAD_ATTR, '')
		document.head.appendChild(tag)
	}
}

function contextFor(r: Route): Record<string, unknown> {
	return r.context ?? {}
}

async function prepareRoute(r: Route, request: NavigationRequest, redirects = 0): Promise<void> {
	if (!request.isCurrent()) return

	const beforeLoad = metaFor(r.name)?.beforeLoad
	if (!beforeLoad) {
		commitRoute(r, request)
		return
	}

	if (redirects > 16) {
		console.warn(`[octane-xplat] beforeLoad redirect loop for '${r.name}'`)
		return
	}

	try {
		const returned = await beforeLoad({ params: r.params, context: contextFor(r) })
		const context = returned ? { ...contextFor(r), ...returned } : contextFor(r)
		commitRoute(
			{
				...r,
				context,
			},
			request,
		)
	} catch (e) {
		if (!request.isCurrent()) return
		if (e instanceof RouteRedirect) {
			await prepareRoute(e.route, request, redirects + 1)
			return
		}

		console.warn(`[octane-xplat] beforeLoad('${r.name}') rejected: ${(e as Error)?.message ?? e}`)
	}
}

export function redirect(r: Route): never {
	throw new RouteRedirect(r)
}

export function pushRoute(r: Route): void {
	const request = navigationRequests.begin('history')
	if (metaFor(r.name)?.beforeLoad) {
		void prepareRoute(r, request)
		return
	}

	commitRoute(r, request)
}

function commitRoute(r: Route, request: NavigationRequest): void {
	if (!request.isCurrent()) return
	const route: Route = { ...r, presentation: r.presentation ?? presentationFor(r.name) }
	const loader = routeLoaders[route.name] ?? routes.find((meta) => meta.name === route.name)?.loader
	if (
		loader &&
		!Object.prototype.hasOwnProperty.call(route, 'loaderData') &&
		!Object.prototype.hasOwnProperty.call(route, 'loaderError')
	) {
		void Promise.resolve()
			.then(() => loader(route.params))
			.then(
				(loaderData) => commitRoute({ ...route, loaderData }, request),
				(loaderError) => commitRoute({ ...route, loaderError }, request),
			)

		return
	}

	saveScroll()
	read()
	// Include the entry we are leaving, even if it was the initial URL.
	history.replaceState({ ...history.state, __octaneXplatDepth: historyDepth,
		__octaneXplatEntry: rememberRouteState(history.state?.__octaneXplatEntry) }, '')

	historyDepth += 1
	if (route.presentation === 'modal') {
		modalRoute = route
	} else {
		current = route
		modalRoute = null
	}

	history.pushState({ __octaneXplatDepth: historyDepth, __octaneXplatEntry: rememberRouteState() }, '', buildRoutePath(routes, route))
	lastKey = scrollKey()

	applyHead(modalRoute ?? current ?? null)
	emit()
}

function presentationFor(name: string): Route['presentation'] {
	return routes.find((m) => m.name === name)?.presentation
}

/** Web history is one linear stack — back pops whatever route is current;
 *  per-stack pops aren't expressible, so `stack` is accepted for parity
 *  and ignored. A pushed modal is the top entry, so back dismisses it. */
export function popRoute(_stack = 'root'): void {
	navigationRequests.invalidate('history')
	history.back()
}

let backInterceptorWarned = false

/** No-op twin of the native leaf. Browser back is already real history —
 *  there is no hardware-back event to intercept on web, so registered
 *  interceptors never fire. Warns once so a mistaken call site isn't
 *  silently absent. */
export function addBackInterceptor(_fn: () => boolean): () => void {
	if (!backInterceptorWarned) {
		backInterceptorWarned = true
		console.warn(
			'[octane-xplat] addBackInterceptor is a no-op on web — browser back is URL history, not an interceptable event.',
		)
	}

	return () => {}
}

window.addEventListener('popstate', () => {
	navigationRequests.invalidate('history')
	saveScroll()
	historyDepth = history.state?.__octaneXplatDepth ?? 0
	lastKey = scrollKey()
	restoreRouteState()
	applyHead(modalRoute ?? current ?? null)
	restoreScroll()
	emit()
})

/** Current route if it targets `stack`, else null. */
export function routeFor(stack: string): Route | null {
	const c = read()
	return c && c.stack === stack ? c : null
}

/** Web has one linear browser history; expose its active route stack for parity. */
export function routeStacks(): string[] {
	const route = read()
	return route ? [route.stack] : []
}

/** The route active at boot — for deep-link tab selection. */
export function currentRoute(): Route | null {
	return read()
}

/** The modal route overlaying the current one, if any. */
export function currentModalRoute(): Route | null {
	read()
	return modalRoute
}

/** Deep-link entry, web half — the URL *is* the route state, so this is a
 *  plain pushRoute of the matched path (parity with the native leaf, where
 *  apps wire `onDeepLink(pushDeepLink)`). */
export function pushDeepLink(url: string): boolean {
	const r = matchUrl(routes, linkPath(url))
	if (!r || !screenFor(r.name)) {
		console.warn(`[octane-xplat] pushDeepLink('${url}') dropped — no route matches.`)
		return false
	}

	pushRoute(r)
	return true
}

/** URL for a Route — Link's href and shareable-path helper. */
export function hrefFor(r: Route): string {
	return buildRoutePath(routes, r)
}

export function useRoute(stack: string): Route | null {
	return useSyncExternalStore(
		(cb) => {
			listeners.add(cb)
			return () => listeners.delete(cb)
		},
		() => routeFor(stack),
	)
}

/** Whether the selected conceptual stack has an in-app route to pop. A
 * browser's pre-app history is intentionally not counted. */
export function canGoBack(stack = 'root'): boolean {
	read()
	const route = modalRoute ?? current
	return historyDepth > 0 && route?.stack === stack
}

export function useCanGoBack(stack = 'root'): boolean {
	return useSyncExternalStore(
		(cb) => {
			listeners.add(cb)
			return () => listeners.delete(cb)
		},
		() => canGoBack(stack),
	)
}

/** The modal route overlaying the shell — outlets render it above their
 *  normal content (URL preserved underneath). */
export function useModalRoute(): Route | null {
	return useSyncExternalStore(
		(cb) => {
			listeners.add(cb)
			return () => listeners.delete(cb)
		},
		() => modalRoute,
	)
}
