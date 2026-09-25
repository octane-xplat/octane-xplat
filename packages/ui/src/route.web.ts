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
import type { Route, RouteManifest, RouteMeta, ScreenTable } from './props'
import { buildRoutePath, layoutChain, linkPath, matchUrl, runLoader } from './route-table'

// ---------- screen registry ----------

let screens: ScreenTable = {}
let routes: RouteMeta[] = []
let routeLayouts: Record<string, any> = {}

/** Register the app's name → screen table. On web the table feeds
 *  `screenFor` — the fallback outlet resolution in Tabs when no
 *  `resolveScreen` prop is given; on native `pushRoute` resolves
 *  `route.name` through it. `manifest` (from deriveRouteManifest) enables
 *  path-param matching — call once from the shared routes module. */
export function registerScreens(table: ScreenTable, manifest?: RouteMeta[]): void {
	screens = table
	routes = manifest ?? []
	// Registration can land after the first lazy parse (deep link read
	// before the routes module ran) — re-parse with patterns present.
	if (current !== undefined) {
		current = parse()
		emit()
	}
}

/** One-call registration for route-dir apps — screens + URL patterns +
 *  layouts all come from deriveRouteManifest. */
export function registerRoutes(manifest: RouteManifest): void {
	registerScreens(manifest.screens, manifest.routes)
	routeLayouts = manifest.layouts
}

export function screenFor(name: string): ScreenTable[string] | undefined {
	return screens[name]
}

/** Directory layouts wrapping a route, outermost → innermost — outlets
 *  wrap their resolved element with these (`_layout.tsrx` files). */
export function layoutsFor(name: string): any[] {
	return layoutChain(routeLayouts, name)
}

// ---------- the store ----------

const listeners = new Set<() => void>()
// Lazy — the manifest registers after this module evaluates, and parse()
// needs its patterns for path params.
let current: Route | null | undefined
let modalRoute: Route | null = null

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
	if (y !== undefined) requestAnimationFrame(() => window.scrollTo(0, y))
}

function parse(): Route | null {
	return matchUrl(routes, location.pathname + location.search)
}

function read(): Route | null {
	if (current === undefined) current = parse()
	return current
}

function emit() {
	listeners.forEach((l) => l())
}

export function pushRoute(r: Route): void {
	saveScroll()
	const route: Route = { ...r, presentation: r.presentation ?? presentationFor(r.name) }
	runLoader(routes, route)
	history.pushState(null, '', buildRoutePath(routes, route))
	lastKey = scrollKey()
	if (route.presentation === 'modal') modalRoute = route
	else {
		current = route
		modalRoute = null
	}

	emit()
}

function presentationFor(name: string): Route['presentation'] {
	return routes.find((m) => m.name === name)?.presentation
}

/** Web history is one linear stack — back pops whatever route is current;
 *  per-stack pops aren't expressible, so `stack` is accepted for parity
 *  and ignored. A pushed modal is the top entry, so back dismisses it. */
export function popRoute(_stack = 'root'): void {
	history.back()
}

window.addEventListener('popstate', () => {
	saveScroll()
	lastKey = scrollKey()
	modalRoute = null
	current = parse()
	restoreScroll()
	emit()
})

/** Current route if it targets `stack`, else null. */
export function routeFor(stack: string): Route | null {
	const c = read()
	return c && c.stack === stack ? c : null
}

/** The route active at boot — for deep-link tab selection. */
export function currentRoute(): Route | null {
	return read()
}

/** The modal route overlaying the current one, if any. */
export function currentModalRoute(): Route | null {
	return modalRoute
}

/** Deep-link entry, web half — the URL *is* the route state, so this is a
 *  plain pushRoute of the matched path (parity with the native leaf, where
 *  apps wire `onDeepLink(pushDeepLink)`). */
export function pushDeepLink(url: string): boolean {
	const r = matchUrl(routes, linkPath(url))
	if (!r) {
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
