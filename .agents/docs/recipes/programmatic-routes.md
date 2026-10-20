# Register routes from runtime data

ID: programmatic-routes
Targets: web, ios, android, macos
Related APIs: defineRoute, defineRoutes, defineRuntimeRoutes, configureRouter, router.addRoutes, router, RouteOutlet, createRouter, RouterProvider, useRouter, getRouteApi, RouteRegistration, mergeRouteManifests,
RouteSpec, RouteSpecSet, RouteManifest, xplat.routes.json, Destination,
NavLink, validateDestination, ValidatedDestination, DestinationValidationResult,
getRouteApi.useUpdateSearch, RouteSearchUpdater, useNavigation, RouterNavigationState, clearFailure

## Starting point

A working app whose file-derived routes already navigate (`app/` route dir +
`xplat routes` codegen and its generated client startup). The reader
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
  infer names/params at the callsite; configured manifest exports get generated
  registration that checks canonical navigation and `NavLink` against them. Application
  authors do not write `declare module`. Runtime-computed paths use `defineRuntimeRoutes`, `navigateUrl` for URLs, or async `validateDestination` for destination objects; unchecked destination assertions are not part of this workflow.
- Infer preparation before checking a screen with `defineRoute(options).screen(component)`.
  Named components can use `RouteScreenProps<typeof preparation>` without
  repeating the loader result. Inline callbacks follow validator, guard, loader
  dependency order; named parser values retain their known types in other orders.

## Acceptance criteria

- AC1: The reader can register routes derived from a data array (e.g. one
  route per content record) so they push and render on each target. Screen
  attachment checks the inferred preparation contract; unfinished builders,
  incompatible named screens, and flat screen options are rejected. Named search
  output interfaces preserve inferred fields without an index signature, for
  plain/async parsers and Standard Schema; invalid non-record results stop before loading.
- AC2: A programmatic route participates in named stacks and picks up both
  file `_layout` wraps and `defineRoutes` `layouts` entries like a file
  route does.
- AC3: The reader can state the startup precedence rule (a later declared manifest wins, with a
  warning; runtime catalogs cannot replace declared contracts), configure a manifest export in `xplat.routes.json` so generated
  registration checks literal-path destinations and links, and reach computed-path destinations through runtime URL/object validation. Checked objects work with navigation, href and link to; cloning, serializing or crossing instance ownership cannot manufacture a proof.
- AC4: On web, a programmatic route produces a real URL and a direct load of
  that URL boots into the screen.

- AC5: When pushes overlap, only the latest request for the affected history
  can commit a guard, redirect, or loader result; back navigation invalidates
  pending work. Native/macOS named stacks remain independent, while web uses
  one history.
  Refined guard and loader redirects share target validation, one attempt's
  context snapshot, bounded following, and stale target-flow protection; only
  the final destination commits.
- AC6: The reader distinguishes the shared default client registry from
  explicit router instances used by custom hosts. Instance registration handles
  replace their own stable ID, reject accidental collisions and remove only
  their owned contribution; they do not widen compile-time destination unions or replace the instance's
  declared contracts. Aggregate reads distinguish the inferred declared union from unknown runtime data; named route accessors
  check the declared rendering entry before exposing inferred output. Computed
  catalogs cannot weaken or shadow finite contracts during startup composition.
  Removing/replacing runtime definitions cannot let an old checked destination
  bypass matching, schemas or guards; validation never starts data loading.
  Reusable generated catalogs and `.contracts` imports keep inferred local
  contracts without contributing to the ambient application registry. The
  generated `.types`/client entries add that registration deliberately.
  Replacing the configured base leaves plugin layers and their disposal handles intact.
  No compatibility registration path or second mutable router store remains.

- AC7: A custom host can bind an explicit instance with `RouterProvider`, infer
  its hook contracts without caller-chosen data types, and keep retained-entry
  reads and Back availability attached to the owning flow. A generated file
  catalog uses structured guard/loader callbacks consistent with its inferred
  contracts. Typed hooks/accessors under a custom provider require that explicit instance,
  preventing ambient contracts from being applied to another catalog. Instance cleanup belongs to its creator, rather than any one provider. Explicit-instance stack
  names are inferred from its configuration, including provider selection,
  destinations and instance-aware hooks; unrelated application stacks are rejected.
  The default client binds the same prepared contracts through
  `configureRouter` and `RouteOutlet`, preserving source providers and retained
  entry state. Browser cold URL entry prepares exactly once without pushing
  history. Generated client entries supply catalog, context and declared stacks
  automatically; maintained consumers use that canonical startup.
  Configured shared Tabs uses owned named outlets and retains base panes across
  selection. Native/AppKit panes retain routed view state; browser shell/base
  identity survives root navigation and Back. Controlled selection remains UI
  state, distinct from a navigation link.
  Every maintained routing consumer uses the canonical client; removed helpers
  are rejected by package checks. Native activity Back targets visible ownership,
  preserving hidden pane history.
  The public pane-host constructor, attachment and RouterPane provide a complete
  retained renderer workflow without internal imports. One host belongs to one
  instance; reuse, cross-instance attachment and cloned bindings are rejected.

## Documentation

- AC1: [Register routes from data](../../../docs/app/navigation.md#register-routes-from-data).
  Includes preparation-first screen attachment and inferred named-screen props.
  Maintained example: `packages/app/src/guides.tsrx` (data array →
  `defineRoutes` → configured generated catalog).
- AC2: [layouts map and outlet resolution](../../../docs/app/navigation.md#register-routes-from-data);
  `packages/app/src/app/_layout.tsrx` mounts canonical root and named outlets;
  layouts are composed from the instance catalog at render selection.
- AC3: [precedence and the typing boundary](../../../docs/app/navigation.md#register-routes-from-data)
  and [validate a destination from data](../../../docs/app/navigation.md#validate-a-destination-from-data)
  and [edit a rendering entry's search](../../../docs/app/navigation.md#edit-the-current-screens-filters)
  and the [Navigation limits row](../../../docs/testing/known-limits.md#navigation).
- AC4: [Register routes from data](../../../docs/app/navigation.md#register-routes-from-data);
  web smoke in `apps/web/scripts/smoke.ts` deep-links `/test/guides/deploy`.

- AC5: [Flow-owned loading and recovery](../../../docs/app/navigation.md#handle-pending-work-and-failures), [Loader and presentation behavior](../../../docs/app/navigation.md#present-a-route-modally)
  and [guard behavior](../../../docs/app/navigation.md#guard-a-route-and-supply-context).
  Regression example: `packages/ui/src/router-instance.test.ts` and `browser-router-host.web.test.tsrx`.
- AC6: [Default client scope](../../../docs/app/navigation.md#what-the-route-generator-writes)
  and [owned runtime registrations](../../../docs/app/navigation.md#own-runtime-registrations),
  plus [checked object destinations](../../../docs/app/navigation.md#validate-a-destination-from-data).
  Generation inspects value-export syntax without executing screen modules;
  unchanged outputs retain timestamps. App-owned `xplat dev` or an explicit
  `xplat routes --watch` follows file additions, renames, removals and configured
  source repairs; shared workspace routes have one package-owned watcher.
  Output relocation and arbitrary filesystem reads require the explicit workflow
  in the guide. Runtime hot reload remains separate from generated-file evidence.
  Maintained protocol fixtures: `packages/ui/src/route-registry.test.ts`,
  `router-instance.test.ts`, and `routing-package.test.ts`. These establish
  core behavior and consumer types, not platform host integration.


- AC7: [Bind a custom router to rendering](../../../docs/app/navigation.md#bind-a-custom-router-to-rendering).
  Includes a public host factory, inferred catalog, checked pane names, toolbar
  providers, rendered-commit acknowledgement and app/window cleanup.
  Maintained cross-renderer example: `packages/ui/tests/pane-router-example.tsrx`;
  packed runtime: `apps/web/scripts/routing-pane-packed.mjs`.
  [Configured Tabs](../../../docs/app/navigation.md#use-named-panes-with-the-canonical-client)
  covers default-client pane ownership and controlled selection.
  Shared renderer cases: `packages/ui/tests/router-scope-cases.tsrx`, exercised
  by DOM/jsdom and native object-driver tests. Retained entry scopes are
  renderer integration plumbing. Generated client startup is exercised by the
  production browser and release native fixtures. Hard-cutover qualification
  remains separate from historical pre-cutover runs.

## Verification

The [release navigation checks](../navigation-checks.md) exercise this
workflow separately from documentation coverage. Canonical unit and renderer tests
cover cancellation, history, scroll, registration, inferred types and outlet ownership.
The hard cutover changes the maintained browser and native fixtures; refresh runtime
evidence for the changed fixtures before claiming current target qualification.
Historical adapter runs do not prove the cutover or every authoring example.

Native provider ownership is explained in
[preserve providers across native Pages](../../../docs/app/navigation.md#preserve-providers-across-native-pages).
The maintained [iOS route fixture](../../../packages/ui/tests/fixtures/owned-routes.ios.tsrx)
and [Android route fixture](../../../packages/ui/tests/fixtures/owned-routes.android.tsrx)
cover outlet context, hidden Page updates, local state, cancellation and owner
teardown. The iOS fixture also pushes through a native tab's named Frame.
These standalone ownership fixtures use programmatic navigation. The Android release suite exercises three real OS Back key events;
swipe/predictive gestures and physical hit-testing remain unverified.
