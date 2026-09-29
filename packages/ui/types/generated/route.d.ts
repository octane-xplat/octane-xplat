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
import type { Route, RouteManifest, RouteMeta, ScreenTable } from './props.js';
export type { Route } from './props.js';
/** Register the app's name → screen table (call once, from the shared
 *  routes module). Native `pushRoute` resolves `route.name` through it;
 *  on web the table feeds `screenFor` for outlets without a
 *  `resolveScreen` prop. `manifest` (from deriveRouteManifest) is stored
 *  for parity — the web leaf matches URLs through it; native navigation
 *  is name+params and only needs the table. */
export declare function registerScreens(table: ScreenTable, manifest?: RouteMeta[]): void;
/** One-call registration for route-dir apps — screens + URL patterns +
 *  layouts all come from deriveRouteManifest. */
export declare function registerRoutes(manifest: RouteManifest): void;
/** Layer a programmatic manifest (from `defineRoutes`) over the registered
 *  routes — same-name entries win over the base with a warn, so a host
 *  framework can override a file route deliberately. Registered layers
 *  survive later registerRoutes re-registration (e.g. routes.gen HMR). */
export declare function addRoutes(manifest: RouteManifest): void;
export declare function layoutsForRoute(name: string): any[];
export declare function screenFor(name: string): ScreenTable[string] | undefined;
/** Register an Android hardware-back interceptor. Interceptors run
 *  most-recent-first (so the topmost mounted screen wins) before the
 *  framework's default pop; returning true consumes the press. Returns
 *  an unsubscribe. iOS has no hardware back — interceptors simply never
 *  fire there. */
export declare function addBackInterceptor(fn: () => boolean): () => void;
export declare function redirect(r: Route): never;
export declare function pushRoute(r: Route): void;
/** Pop the top page of a stack ('root' default) — or dismiss the top
 *  modal if one is open. Quiet no-op at the base page — matching web,
 *  where back at the app root is a no-op; loud only when the stack
 *  itself doesn't exist. */
export declare function popRoute(stack?: string): void;
/** Route stamped on a stack's current page, or null at its base page. */
export declare function routeFor(stack: string): Route | null;
/** The top route across stacks — root's current route wins (a root push
 *  covers the shell); otherwise the most recently registered named stack
 *  showing a pushed page. Native has no boot URL, so this is an
 *  approximation of web's "current URL route", not a deep link. */
export declare function currentRoute(): Route | null;
/** Named stacks containing routes, including Android's swap-pane stacks. */
export declare function routeStacks(): string[];
/** The modal route currently open, if any — parity with the web leaf. */
export declare function currentModalRoute(): Route | null;
/** Deep-link entry: normalize a URL (http(s) or app-scheme) to a path,
 *  match it against the manifest, push the route. Wire it at boot:
 *  `onDeepLink(pushDeepLink)` plus one `consumeInitialUrl()` call. */
export declare function pushDeepLink(url: string): boolean;
/** Path-string parity for the web leaf's hrefFor — a canonical
 *  /<stack>/<path> rendering of the route (deep-linking consumes it
 *  there). Native navigation itself is name+params, not URLs. */
export declare function hrefFor(r: Route): string;
export declare function useRoute(stack: string): Route | null;
/** Whether the selected native stack has a page (or route-owned Android swap
 * entry) that can be popped. The modal root is also a back affordance. */
export declare function canGoBack(stack?: string): boolean;
export declare function useCanGoBack(stack?: string): boolean;
/** The modal route overlaying the shell — parity with the web leaf. */
export declare function useModalRoute(): Route | null;
