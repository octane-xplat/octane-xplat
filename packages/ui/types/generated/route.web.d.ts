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
export type { Route } from './props.js';
import type { Route, RouteManifest, RouteMeta, ScreenTable } from './props.js';
/** Register the app's name → screen table. On web the table feeds
 *  `screenFor` — the fallback outlet resolution in Tabs when no
 *  `resolveScreen` prop is given; on native `pushRoute` resolves
 *  `route.name` through it. `manifest` (from deriveRouteManifest) enables
 *  path-param matching — call once from the shared routes module. */
export declare function registerScreens(table: ScreenTable, manifest?: RouteMeta[]): void;
/** One-call registration for route-dir apps — screens + URL patterns +
 *  layouts all come from deriveRouteManifest. */
export declare function registerRoutes(manifest: RouteManifest): void;
/** Layer a programmatic manifest (from `defineRoutes`) over the registered
 *  routes — same-name entries win over the base with a warn, so a host
 *  framework can override a file route deliberately. Registered layers
 *  survive later registerRoutes re-registration (e.g. routes.gen HMR). */
export declare function addRoutes(manifest: RouteManifest): void;
export declare function screenFor(name: string): ScreenTable[string] | undefined;
/** Directory layouts wrapping a route, outermost → innermost — outlets
 *  wrap their resolved element with these (`_layout.tsrx` files). */
export declare function layoutsFor(name: string): any[];
export { layoutsFor as layoutsForRoute };
export declare function redirect(r: Route): never;
export declare function pushRoute(r: Route): void;
/** Web history is one linear stack — back pops whatever route is current;
 *  per-stack pops aren't expressible, so `stack` is accepted for parity
 *  and ignored. A pushed modal is the top entry, so back dismisses it. */
export declare function popRoute(_stack?: string): void;
/** No-op twin of the native leaf. Browser back is already real history —
 *  there is no hardware-back event to intercept on web, so registered
 *  interceptors never fire. Warns once so a mistaken call site isn't
 *  silently absent. */
export declare function addBackInterceptor(_fn: () => boolean): () => void;
/** Current route if it targets `stack`, else null. */
export declare function routeFor(stack: string): Route | null;
/** Web has one linear browser history; expose its active route stack for parity. */
export declare function routeStacks(): string[];
/** The route active at boot — for deep-link tab selection. */
export declare function currentRoute(): Route | null;
/** The modal route overlaying the current one, if any. */
export declare function currentModalRoute(): Route | null;
/** Deep-link entry, web half — the URL *is* the route state, so this is a
 *  plain pushRoute of the matched path (parity with the native leaf, where
 *  apps wire `onDeepLink(pushDeepLink)`). */
export declare function pushDeepLink(url: string): boolean;
/** URL for a Route — Link's href and shareable-path helper. */
export declare function hrefFor(r: Route): string;
export declare function useRoute(stack: string): Route | null;
/** Whether the selected conceptual stack has an in-app route to pop. A
 * browser's pre-app history is intentionally not counted. */
export declare function canGoBack(stack?: string): boolean;
export declare function useCanGoBack(stack?: string): boolean;
/** The modal route overlaying the shell — outlets render it above their
 *  normal content (URL preserved underneath). */
export declare function useModalRoute(): Route | null;
