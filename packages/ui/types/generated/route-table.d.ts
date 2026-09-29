/** Shared route-dir manifest — the file-router half of the nav contract
 *  (docs/navigation-notes.md). Apps glob their route dir per platform and
 *  pass the module map here; the suffix seam applies to directories the
 *  same way it does to imports:
 *
 *    // route-manifest.web.ts — generated globs also omit a plain route when
 *    // a `.web` twin exists, so native-default modules are never evaluated.
 *    const files = import.meta.glob(
 *      ['./app/**\/*.{tsrx,tsx}', '!./app/**\/*.mobile.{tsrx,tsx}',
 *       '!./app/**\/*.ios.{tsrx,tsx}', '!./app/**\/*.android.{tsrx,tsx}',
 *       '!./app/**\/*.macos.{tsrx,tsx}', '!./app/**\/*.windows.{tsrx,tsx}',
 *       '!./app/**\/*.linux.{tsrx,tsx}'],
 *      { eager: true });
 *    export const routes = deriveRouteManifest(files, ['web']);
 *
 *    // route-manifest.mobile.ts — excludes *.web.tsrx; prefer by running OS
 *    export const routes = deriveRouteManifest(files,
 *      Device.os === 'Android' ? ['android', 'mobile'] : ['ios', 'mobile']);
 *
 *  Conventions (route dir = `dir`, default 'app'):
 *    app/detail.tsrx        → route 'detail'
 *    app/demo/[id].tsrx     → route 'demo/:id'  ([param] → :param)
 *    app/foo/index.tsrx     → 'foo'           (index = the dir's own route)
 *    app/settings.web.tsrx  → 'settings' on web only — `prefer` decides
 *    app/_layout.tsrx       → layouts['']     — a shell, not a route
 *    app/chat/_layout.tsrx  → layouts['chat'] — nested shells cataloged
 *
 *  `prefer` ranks platform suffixes — a suffix absent from it is another
 *  platform's file and is skipped entirely; unsuffixed files are the
 *  fallback (rank = prefer.length). Web callers pass ['web']; mobile
 *  callers pass the running OS first. */
import type { Route, RouteManifest, RouteMeta, RouteSpec, RouteSpecSet } from './props.js';
/** Internal error carrier used by the public `redirect()` helper. Keeping
 * this in the shared route table gives both platform leaves the same guard
 * behavior without importing a platform runtime. */
export declare class RouteRedirect extends Error {
    readonly route: Route;
    constructor(route: Route);
}
export declare function deriveRouteManifest(files: Record<string, any>, prefer: readonly string[], dir?: string): RouteManifest;
/** Build a manifest from app data rather than the route dir — the
 *  programmatic half of the route contract (host frameworks derive specs
 *  from their own sources, e.g. `readdirSync` over a content dir). Each
 *  spec's `path` uses the route-dir vocabulary; `layouts` keys are path
 *  prefixes playing the `_layout` role. Same-name duplicates inside the
 *  set keep the later entry with a warn, matching merge precedence. */
export declare function defineRoutes(input: readonly RouteSpec[] | RouteSpecSet): RouteManifest;
/** Compose manifests into one — file-derived base plus any number of
 *  programmatic sets (`registerRoutes(mergeRouteManifests(fromDir, dynamic))`).
 *  Registration order is precedence: on a same-name collision the later
 *  manifest's route wins and the loser's loader/beforeLoad/head go with it —
 *  a warn fires once per colliding name. `layouts` merge key-wise the same
 *  way. `matchRoute` order is rebuilt by specificity after the merge. */
export declare function mergeRouteManifests(...manifests: RouteManifest[]): RouteManifest;
/** Match URL path segments against a manifest — returns the winning meta
 *  plus extracted params, or null. First hit wins (routes are pre-sorted
 *  by specificity). */
export declare function matchRoute(routes: readonly RouteMeta[], segs: string[]): {
    meta: RouteMeta;
    params: Record<string, unknown>;
} | null;
/** Serialize a Route to a URL path (no origin): manifest routes substitute
 *  `:param` segments from params (leftover params → query string);
 *  non-manifest names keep the legacy `/<stack>/<name>?params` shape. */
export declare function buildRoutePath(routes: readonly RouteMeta[], r: Route): string;
/** `?a=1&b=2` → params — shared code carries no URLSearchParams
 *  (invariant 4: no DOM globals on the native path). */
export declare function parseQueryString(qs: string | undefined): Record<string, unknown>;
/** Full URL or path → canonical path for matching. `https://x/a/b?y` →
 *  `/a/b?y`; custom-scheme links keep their host as the first segment —
 *  `textcoral://post/5` → `/post/5` (the common app-scheme convention). */
export declare function linkPath(url: string): string;
/** Match a URL path+query against the manifest into a Route — the shared
 *  half of web's URL parse and native's deep-link handling. Whole-path
 *  match wins ('/demo/x' → root 'demo/:id'); a non-matching first segment
 *  is the stack prefix ('/demos/demo/x' → stack 'demos'). Unmatched names
 *  fall through as literal routes for pre-manifest callers. */
export declare function matchUrl(routes: readonly RouteMeta[], url: string): Route | null;
/** Fire a route's `loader` export — prefetch, not a data layer: the
 *  screen's own `query$` reads still own the data, this just warms the
 *  cache before mount. Sync throws and async rejections warn rather
 *  than break navigation. */
export declare function runLoader(routes: readonly RouteMeta[], r: Route): void;
/** Layout components wrapping a route name, outermost → innermost —
 *  'chat/room' picks up `app/chat/_layout.tsrx`, 'a/b/c' chains 'a' then
 *  'a/b'. The '' root layout is the app's own shell (entry renders it)
 *  and never joins a chain. Leaves apply the chain at render: native
 *  wraps each pushed Page's component, web wraps the outlet's resolved
 *  element. */
export declare function layoutChain(layouts: Record<string, any>, name: string): any[];
