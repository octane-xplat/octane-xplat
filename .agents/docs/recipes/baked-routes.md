# Bake route data into the bundle

ID: baked-routes
Targets: web, ios, android, macos
Related APIs: dataMode, RouteSpec.baked, RouteSpecSet.baked, RouteMeta,
loader, bakedRouteData, routes.gen.data.ts, routes.gen.manifest.json,
Markdown, MarkdownScreen, manifestToJson, generateRoutes, Xplat routes

## Starting point

A working app with file-derived routes (`app/` route dir + `xplat routes`
codegen). The reader has content whose source is known at build time —
in-app help, changelogs, release notes, a content directory — and wants it
to render on every target with no runtime fetch.

## Requirements

- Declare a `dataMode: 'baked'` route whose loader output is computed during
  `xplat routes`/`dev`/`build` and arrives on the screen as the `data` prop
  on web and native.
- Put the loader in a `<stem>.loader.*` sibling so its dependency graph
  (node builtins, content pipelines) never enters a bundle, and understand
  why an in-file `loader` export on a baked route is rejected.
- Ship `.md` files in the route dir as baked routes rendering through the
  shared vocabulary.
- Keep baked results JSON-serializable, regenerate after loader edits, and
  understand that bake-time loaders run once with no params.

## Acceptance criteria

- AC1: The reader can make a route render baked data on web and native —
  screen receives `data`, no navigation-time fetch occurs.
- AC2: The reader can place a `.md` file in the route dir and navigate to it
  as a rendered document route on each target.
- AC3: The reader declares build mode as a locally resolvable const literal,
  uses explicit named value exports instead of wildcard route exports, and
  can state the constraints: loader output must contain
  plain JSON values without silent loss (invalid output fails `xplat routes`
  naming the route and field), loaders receive `{}` params (param'd content bakes a table the
  screen selects from), baked routes without a `.loader.*` sibling fail
  codegen, and `xplat typecheck` does not re-bake. Failed or cancelled baking
  preserves the last successful generated outputs; a watcher discards obsolete
  publication without claiming to undo a loader's effects.
- AC4: The reader can find the normalized route list
  (`routes.gen.manifest.json` / `manifestToJson`) for handing routes to an
  external host.
- AC5: Generated screen props and route accessors infer named/default sibling
  loader outputs and Markdown `MdDoc` data without executing loaders during
  typechecking. Programmatic catalogs infer DTOs from their supplied baked map;
  missing, optional or erased maps remain unknown, and extra map keys do not
  declare destinations. Build-only modules stay out of runtime catalogs and bundles.

## Documentation

- AC1: [Bake route data at build time](../../../docs/app/navigation.md#bake-route-data-at-build-time).
  Maintained example: `packages/app/src/app/changelog.tsrx` +
  `changelog.loader.ts` (`data` prop, `node:fs` inside the loader).
- AC2: [Route a markdown file](../../../docs/app/navigation.md#route-a-markdown-file).
  Maintained example: `packages/app/src/app/notes.md`.
- AC3: [constraints list](../../../docs/app/navigation.md#bake-route-data-at-build-time)
  — serializability, param-less bake, sibling requirement, typecheck
  behavior.
- AC4: [Hand the route list to a host](../../../docs/app/navigation.md#hand-the-route-list-to-a-host).
- AC5: [Bake route data at build time](../../../docs/app/navigation.md#bake-route-data-at-build-time),
  the typed changelog example, generated-contract negative fixtures and the
  mobile/AppKit baked-route fixtures exercise inferred props and build boundaries.

## Verification

The [release navigation checks](../navigation-checks.md) exercise this
workflow separately from documentation coverage. Web production checks cover cold changelog loader data and Markdown rendering.
The maintained native and AppKit fixtures generate a typed baked screen and a
Markdown route, inspect actual rendered data and Back, and check release output
for the build-only marker. Record executed targets separately in `recipe_audit`;
a successful web run does not establish native behavior.
