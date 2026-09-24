import { useSyncExternalStore } from 'octane';

/** Web route store — the browser half of the nav contract. One linear URL
 *  stack; `stack` names the conceptual outlet ('root' covers the app, a
 *  named stack is the pane that owns it — parallel stacks map to nested
 *  routes). URL shape: /<stack>/<path>?query or /<path>?query for root,
 *  where <path> comes from the route-dir manifest — `app/demo/[id].tsrx`
 *  pushes as /demo/<id-value>. Names not in the manifest keep the legacy
 *  /<name>?params shape. Module-scope like every other store — the pane
 *  that owns `stack` subscribes with useRoute(stack) and swaps content. */

export type { Route } from './props';
import type { Route, RouteManifest, RouteMeta, ScreenTable } from './props';
import { buildRoutePath, matchRoute } from './route-table';

// ---------- screen registry ----------

let screens: ScreenTable = {};
let routes: RouteMeta[] = [];

/** Register the app's name → screen table. On web the table feeds
 *  `screenFor` — the fallback outlet resolution in Tabs when no
 *  `resolveScreen` prop is given; on native `pushRoute` resolves
 *  `route.name` through it. `manifest` (from deriveRouteManifest) enables
 *  path-param matching — call once from the shared routes module. */
export function registerScreens(table: ScreenTable, manifest?: RouteMeta[]): void {
	screens = table;
	routes = manifest ?? [];
	// Registration can land after the first lazy parse (deep link read
	// before the routes module ran) — re-parse with patterns present.
	if (current !== undefined) {
		current = parse();
		emit();
	}
}

/** One-call registration for route-dir apps — screens + URL patterns +
 *  layouts all come from deriveRouteManifest. */
export function registerRoutes(manifest: RouteManifest): void {
	registerScreens(manifest.screens, manifest.routes);
}

export function screenFor(name: string): ScreenTable[string] | undefined {
	return screens[name];
}

// ---------- the store ----------

const listeners = new Set<() => void>();
// Lazy — the manifest registers after this module evaluates, and parse()
// needs its patterns for path params.
let current: Route | null | undefined;

function queryParams(): Record<string, unknown> {
	const params: Record<string, unknown> = {};
	new URLSearchParams(location.search).forEach((v, k) => (params[k] = v));
	return params;
}

function parse(): Route | null {
	const segs = location.pathname.split('/').filter(Boolean);
	if (!segs.length) return null;
	const query = queryParams();
	// Whole path first — a root route wins over stack interpretation.
	const root = matchRoute(routes, segs);
	if (root) return { stack: 'root', name: root.meta.name, params: { ...query, ...root.params } };
	if (segs.length > 1) {
		// Named stack: first segment is the outlet, the rest is the route.
		const named = matchRoute(routes, segs.slice(1));
		if (named)
			return { stack: segs[0], name: named.meta.name, params: { ...query, ...named.params } };
		return { stack: segs[0], name: segs[1], params: query };
	}
	return { stack: 'root', name: segs[0], params: query };
}

function read(): Route | null {
	if (current === undefined) current = parse();
	return current;
}

function emit() {
	listeners.forEach((l) => l());
}

export function pushRoute(r: Route): void {
	history.pushState(null, '', buildRoutePath(routes, r));
	current = r;
	emit();
}

/** Web history is one linear stack — back pops whatever route is current;
 *  per-stack pops aren't expressible, so `stack` is accepted for parity
 *  and ignored. */
export function popRoute(_stack = 'root'): void {
	history.back();
}

window.addEventListener('popstate', () => {
	current = parse();
	emit();
});

/** Current route if it targets `stack`, else null. */
export function routeFor(stack: string): Route | null {
	const c = read();
	return c && c.stack === stack ? c : null;
}

/** The route active at boot — for deep-link tab selection. */
export function currentRoute(): Route | null {
	return read();
}

/** URL for a Route — Link's href and shareable-path helper. */
export function hrefFor(r: Route): string {
	return buildRoutePath(routes, r);
}

export function useRoute(stack: string): Route | null {
	return useSyncExternalStore(
		(cb) => {
			listeners.add(cb);
			return () => listeners.delete(cb);
		},
		() => routeFor(stack),
	);
}
