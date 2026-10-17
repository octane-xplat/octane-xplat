# Register routes from runtime data

ID: programmatic-routes
Targets: web, ios, android, macos
Related APIs: defineRoutes, addRoutes, mergeRouteManifests, registerRoutes,
RouteSpec, RouteSpecSet, RouteManifest, screenFor, layoutsForRoute, pushRoute,
NavLink

## Starting point

A working app whose file-derived routes already navigate (`app/` route dir +
`xplat routes` codegen, or an equivalent `registerRoutes` call). The reader
needs destinations that the file tree cannot express — routes built from a
database, a content directory, or a host framework's own route model.

## Requirements

- Build a route manifest from runtime data and register it so the routes
  push, render, and deep-link like file routes on every target.
- Place programmatic routes in named stacks/outlets and wrap them in
  programmatic or file-derived layouts.
- Understand merge precedence between file-derived and programmatic routes
  and what happens on a same-name collision.
- Navigate to programmatic routes with correct typing — literal-path specs
  infer names/params at the callsite; contributing
  `ManifestRouteParams<typeof manifest>` as an `AppRoutes` member checks
  `pushRoute`/`NavLink` against them. Only runtime-computed
  paths stay outside the typed surface — they assert `as TypedRoute`.

## Acceptance criteria

- AC1: The reader can register routes derived from a data array (e.g. one
  route per content record) so they push and render on each target.
- AC2: A programmatic route participates in named stacks and picks up both
  file `_layout` wraps and `defineRoutes` `layouts` entries like a file
  route does.
- AC3: The reader can state the precedence rule (later manifest wins, with a
  warning), register literal-path spec types on `AppRoutes` via
  `ManifestRouteParams` so `pushRoute`/`NavLink` check them, and
  reach computed-path destinations through the `as TypedRoute` escape.
- AC4: On web, a programmatic route produces a real URL and a direct load of
  that URL boots into the screen.

- AC5: When pushes overlap, only the latest request for the affected history
  can commit a guard, redirect, or loader result; back navigation invalidates
  pending work. Native/macOS named stacks remain independent, while web uses
  one history.
- AC6: The reader knows route registration and reactive state are app-wide per
  loaded UI module; the API does not create independent routers for multiple
  apps in one renderer tree.

## Documentation

- AC1: [Register routes from data](../../../docs/app/navigation.md#register-routes-from-data).
  Maintained example: `packages/app/src/guides.tsrx` (data array →
  `defineRoutes` → `addRoutes`).
- AC2: [layouts map and outlet resolution](../../../docs/app/navigation.md#register-routes-from-data);
  harness `resolveRoute` in `packages/app/src/app/_layout.tsrx` shows the
  `screenFor` + `layoutsForRoute` read.
- AC3: [precedence and the typing boundary](../../../docs/app/navigation.md#register-routes-from-data)
  and the [Navigation limits row](../../../docs/verify/known-limits.md#navigation).
- AC4: [Register routes from data](../../../docs/app/navigation.md#register-routes-from-data);
  web smoke in `apps/web/scripts/smoke.ts` deep-links `/test/guides/deploy`.

- AC5: [Loader and presentation behavior](../../../docs/app/navigation.md#present-a-route-modally)
  and [guard behavior](../../../docs/app/navigation.md#guard-and-document-a-route).
  Regression example: `packages/ui/src/route-navigation.web.test.ts`.
- AC6: [App-wide route scope](../../../docs/app/navigation.md#what-the-route-generator-writes).

## Verification

The [release navigation checks](../../../docs/verify/navigation-checks.md) exercise this
workflow separately from documentation coverage. Web production checks cover
programmatic named routes, layout wrapping, retained loaded history, and cold
URL entry. Native `addRoutes` runtime checks remain unverified.

Native provider ownership is explained in
[preserve providers across native Pages](../../../docs/app/navigation.md#preserve-providers-across-native-pages).
The maintained [iOS route fixture](../../../packages/ui/tests/fixtures/owned-routes.ios.tsrx)
and [Android route fixture](../../../packages/ui/tests/fixtures/owned-routes.android.tsrx)
cover outlet context, hidden Page updates, local state, cancellation and owner
teardown. The iOS fixture also pushes through a native tab's named Frame.
These checks use programmatic navigation; OS back/swipe gestures remain untested.
