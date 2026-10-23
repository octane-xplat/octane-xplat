# Keep route contracts current while developing

ID: route-generation
Targets: web, ios, android, macos
Related APIs: xplat routes, xplat dev, xplat.routes.json, routes.gen.contracts.ts, routes.gen.types.ts, RouteHeadArgs

## Starting point

An app or shared workspace package owns a configured/conventional route tree.

## Requirements

Keep inferred contracts and generated catalogs current during development,
without executing screen modules or publishing failed/obsolete build results.

## Acceptance criteria

- AC1: The reader uses app-owned `xplat dev` watching or standalone
  `xplat routes --watch`, with one watcher for a shared route package.
  Conventional Vite JavaScript and TypeScript config formats are recognized
  consistently by CLI target discovery and agent workspace discovery.
- AC2: Addition, rename, removal and route-root recreation refresh the union;
  unchanged output files retain timestamps and generated files do not become
  inputs. Moving output requires stopping and migrating imports/artifacts.
- AC3: Configuration/source/bake errors preserve the last successful artifacts.
  Repairs, including creating a missing configured module, resume generation.
  Obsolete/cancelled baking cannot publish partial or late contracts/data.
- AC4: Shutdown releases the watcher and owned dev-server process; the reader
  distinguishes generated-file evidence from platform HMR/screen rendering and
  explicitly regenerates arbitrary loader inputs outside watched paths. On web,
  screen edits and file/configured route additions, renames and removals reach
  the running DOM without restarting the server; document reloads may occur.
- AC5: A representative large catalog preserves finite destinations, required
  params, validated search, guard context and individual loader DTOs through
  generated registration. Compiler and language-service costs are measured with
  workspace and packed declarations, separately from target runtime evidence.
- AC6: Generated variants preserve compatible params, search input/output,
  context and loader data. Shared navigation/links/redirects require availability
  proof for platform-only screens; explicit target catalogs expose only their
  own paths. Missing-screen metadata distinguishes unavailable routes from
  unknown patterns without importing other targets' screen modules. Plain
  `.ts`/`.js` helpers do not create screen contracts.
  Named search output interfaces work without an index signature for both plain
  parsers and Standard Schema. Malformed named callbacks have generated compiler checks and fatal catalog
  diagnostics when loaded; an invalid guard cannot be discarded before a loader runs.
  Generated head arguments retain prepared params, validated search, inherited
  context and awaited/baked loader data without depending on the head return type.

- AC7: Generated file-route code loads on navigation or explicit typed preloading;
  preloading runs no preparation callbacks and grants no access. The reader can
  cancel a wait, handle import failures, and distinguish Web chunks from native
  host bundling. Layouts, Markdown and programmatic imports stay eager.

## Documentation

- AC1: [Keep contracts current](../../../docs/app/navigation.md#keep-contracts-current-while-developing) and the shared harness's `routes:watch` script.
- AC2: [Keep contracts current](../../../docs/app/navigation.md#keep-contracts-current-while-developing) and maintained generation/filesystem tests.
- AC3: [Keep contracts current](../../../docs/app/navigation.md#keep-contracts-current-while-developing) and the controlled baking publication regression.
- AC4: [Watch qualification](../navigation-checks.md#qualify-route-generation-watching) separates Node/dev-process, real Chromium/Vite rendering, unqualified native HMR and unavailable Windows evidence.
- AC5: [Large route catalogs](../navigation-checks.md#check-large-route-catalogs) provides the maintained generator/compiler/editor benchmark and its measured limits.
- AC6: [Prepared head metadata](../../../docs/app/navigation.md#set-the-route-title-and-metadata), [Share routes across targets](../../../docs/app/navigation.md#share-routes-across-targets) and the maintained `packages/cli/test/route-platform-contracts.test.mjs` consumer/generation fixtures.

- AC7: [Warm a screen](../../../docs/app/navigation.md#warm-a-screen-before-opening-it), the shared Detail screen’s “Warm about screen” action and generated catalogs, `packages/ui/src/lazy-routes.test.ts`, and the generated chunk regression in `packages/cli/test/route-platform-contracts.test.mjs`.
