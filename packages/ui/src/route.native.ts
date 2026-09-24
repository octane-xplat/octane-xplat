/** Native twin of route.web — same Route contract over Frame/Page stacks.
 *  `pushRoute` resolves a stack ('root' = the app's root Frame — an
 *  explicit registerStack('root') or, by default, the Frame returned by
 *  Application.getRootView(); named stacks come from TabSpec.stack panes
 *  or registerStack) and pushes a Page hosting the registered screen —
 *  each pushed Page is its own Octane root (decision #9: pages never
 *  share context with their presenter). Params land as props; named-stack
 *  pushes get `_stack` injected so the screen can popRoute its own stack.
 *
 *  Registration contract (the footgun this module exists to defuse):
 *  - `registerScreens(table)` once — pushRoute resolves `name` through it.
 *  - 'root' needs nothing when the app boots a Frame as its root view
 *    (the standard shape); non-Frame roots can't host pushes at all.
 *  - named stacks register via `TabSpec.stack` or `registerStack`.
 *  Every drop path warns loudly — silent no-ops are how apps ship a
 *  default route on native while working fine on web. */

import { Application, Frame, GridLayout, Page } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import { useSyncExternalStore } from 'octane';
import { getStack, onStackRegistered, stackEntries } from './stacks.native';
import { buildRoutePath } from './route-table';
import type { Route, RouteManifest, RouteMeta, ScreenTable } from './props';

export type { Route } from './props';

// ---------- screen registry ----------

let screens: ScreenTable = {};
let routes: RouteMeta[] = [];

/** Register the app's name → screen table (call once, from the shared
 *  routes module). Native `pushRoute` resolves `route.name` through it;
 *  on web the table feeds `screenFor` for outlets without a
 *  `resolveScreen` prop. `manifest` (from deriveRouteManifest) is stored
 *  for parity — the web leaf matches URLs through it; native navigation
 *  is name+params and only needs the table. */
export function registerScreens(table: ScreenTable, manifest?: RouteMeta[]): void {
	screens = table;
	routes = manifest ?? [];
}

/** One-call registration for route-dir apps — screens + URL patterns +
 *  layouts all come from deriveRouteManifest. */
export function registerRoutes(manifest: RouteManifest): void {
	registerScreens(manifest.screens, manifest.routes);
}

export function screenFor(name: string): ScreenTable[string] | undefined {
	return screens[name];
}

// ---------- stack resolution ----------

const tracked = new WeakSet<Frame>();
const listeners = new Set<() => void>();
const pageRoutes = new WeakMap<Page, Route>();
const warned = new Set<string>();

function emit() {
	listeners.forEach((l) => l());
}

function warnOnce(key: string, msg: string): void {
	if (warned.has(key)) return;
	warned.add(key);
	console.warn('[octane-xplat] ' + msg);
}

/** Attach the route-store emission hook once per frame. `navigatedTo`
 *  fires on push AND on pop (the revealed page re-fires it), so one
 *  listener keeps every useRoute snapshot honest. */
function trackFrame(frame: Frame): void {
	if (tracked.has(frame)) return;
	tracked.add(frame);
	frame.on('navigatedTo', emit);
}

function resolveStack(stack: string): Frame | undefined {
	const frame = getStack(stack);
	if (frame) trackFrame(frame);
	return frame;
}

onStackRegistered((_name, frame) => {
	trackFrame(frame);
	emit();
});

// ---------- the contract ----------

export function pushRoute(r: Route): void {
	const frame = resolveStack(r.stack);
	if (!frame) {
		warnOnce(
			'stack:' + r.stack,
			r.stack === 'root'
				? `pushRoute('${r.name}') dropped — no root Frame. Boot with a Frame as the app root (Application.run create() returning new Frame) or call registerStack('root', frame).`
				: `pushRoute('${r.name}') dropped — no stack '${r.stack}' is registered. Named stacks come from TabSpec.stack on <Tabs> or registerStack('${r.stack}', frame).`,
		);
		return;
	}
	const C = screenFor(r.name);
	if (!C) {
		warnOnce(
			'screen:' + r.name,
			`pushRoute('${r.name}') dropped — '${r.name}' isn't in the screen table. Call registerScreens({ ${r.name}: ... }) at boot.`,
		);
		return;
	}
	if (Application.android && r.stack !== 'root') {
		warnOnce(
			'android:' + r.stack,
			`pushRoute into named stack '${r.stack}' on Android — upstream #11444: the page mounts but currentPage/backStack/goBack never land (pages accumulate). Named-stack pushes are iOS-only until fixed.`,
		);
	}
	// TabViewItem-hosted frames report isLoaded=false after tab-selection
	// lifecycle churn; without this the nav queue defers forever (iOS
	// strand of #11444). callLoaded is idempotent once the flag holds.
	if (!(frame as any).isLoaded) (frame as any).callLoaded?.();
	const props = r.stack === 'root' ? r.params : { ...r.params, _stack: r.stack };
	try {
		frame.navigate({
			create: () => {
				const page = new Page();
				page.id = r.name + '-page';
				page.actionBarHidden = true;
				pageRoutes.set(page, r);
				// Page is a ContentView — single-child (`.content` assignment
				// drops all but the last root view). Root on a GridLayout
				// child so multi-root screens can't silently lose siblings.
				const host = new GridLayout();
				page.content = host;
				// .ts → .tsrx component imports type as () => Element; cast to
				// the universal component shape the root expects.
				createNativeScriptRoot(host).render(
					C as unknown as UniversalComponent, props);
				return page;
			},
		});
	} catch (e) {
		console.warn('[octane-xplat] pushRoute(' + r.name + ') threw: ' + (e as Error)?.message);
	}
}

/** Pop the top page of a stack ('root' default). Quiet no-op at the base
 *  page — matching web, where back at the app root is a no-op; loud only
 *  when the stack itself doesn't exist. */
export function popRoute(stack = 'root'): void {
	const frame = resolveStack(stack);
	if (!frame) {
		warnOnce(
			'pop:' + stack,
			`popRoute('${stack}') dropped — no such stack is registered.`,
		);
		return;
	}
	frame.goBack();
}

/** Route stamped on a stack's current page, or null at its base page. */
export function routeFor(stack: string): Route | null {
	const page = resolveStack(stack)?.currentPage;
	return (page && pageRoutes.get(page)) ?? null;
}

/** The top route across stacks — root's current route wins (a root push
 *  covers the shell); otherwise the most recently registered named stack
 *  showing a pushed page. Native has no boot URL, so this is an
 *  approximation of web's "current URL route", not a deep link. */
export function currentRoute(): Route | null {
	const root = routeFor('root');
	if (root) return root;
	const named = [...stackEntries()].reverse();
	for (const [name] of named) {
		const r = routeFor(name);
		if (r) return r;
	}
	return null;
}

/** Path-string parity for the web leaf's hrefFor — a canonical
 *  /<stack>/<path> rendering of the route (deep-linking consumes it
 *  there). Native navigation itself is name+params, not URLs. */
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
