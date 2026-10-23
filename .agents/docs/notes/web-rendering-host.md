# Web rendering host

Decision #122 adds an optional `@octane-xplat/web-host` lifecycle around the
existing executable route catalog. Request preparation uses the host-free core;
a request-local read-only adapter renders the same outlet tree as the browser.
Only the explicit public projection reaches screen props and bootstrap JSON.
Browser adoption is allowed once before the host mounts; normal navigation,
refresh and traversal continue through guards and loaders.

The document is a server-authored shell. Its app container hydrates; document
hooks do not acquire a browser lifetime. Component and template documents share
asset and transfer handling. Rendering mode (`server`/`client`) does not change
route data provenance (`live`/`baked`). No server-loader RPC, server-export
stripping, lazy loading or static-path generation is implied.

## Octane 0.14.0 outlet hydration constraint

**Observed in a DOM runtime, bounded workaround.** The original browser outlet
rendered a fragment of a resume component, a base div and keyed route/modal
lists as context-provider children. Compiling the same tree for server and
browser caused `hydrateRoot` to report a structural mismatch and replace the
server button. This reproduced with both development SSR and a production SSR
bundle against a production browser bundle; matching data, entry IDs and
`identifierPrefix` were insufficient.

A `display: contents` div around those provider children gives the compiler a
stable element root. The maintained
[host regression](../../../packages/web-host/test/host.test.mjs) checks preserved
node identity, `useId`, interaction, zero recoverable mismatches, no initial
loader replay and later preparation. It runs Octane's compiled browser bundle
in jsdom. This does not qualify physical input, layout or accessibility.

The upstream runtime's `adopt` rejects a nonempty fragment at a closing block
cursor (`octane/src/runtime/hydration.ts`, 0.14.0). The observed mismatch occurs
in the generated provider-children fragment. This record establishes that
specific shape, not a general failure of fragment hydration. Xplat retains the
stable wrapper and does not patch Octane. Recheck the fragment form when
upgrading Octane before removing the wrapper.

Selecting a custom `App` through a conditional block in `WebRouterRoot` also
produced a hydration mismatch in the same harness. Selecting the component
before rendering one `<App>` preserves node identity, including a custom shell
using the public `RouteOutlet` and a named-stack deep link. These are bounded
compiler/runtime observations, not proof of general component hydration parity.

## Server compilation and HTTP transport

Octane's SSR compiler retargets `octane` to `octane/server`, which has no
`createRoot` export. The UI barrel imports browser overlay services using that
export even when an app only renders `Text`. `webHost()` binds the two services'
shared root factory to a server leaf that explicitly rejects root construction.
This makes their imports compile; it does not add SSR support for imperative
overlays. Recheck this adapter when Octane's server exports change. The host
regressions build through the public UI barrel as well as the routing entries.

The example uses `srvx` for listening and Fetch conversion, and `srvx/static`
for browser assets. Xplat owns no Node HTTP adapter. Maintained Node HTTP tests
cover HTML, assets, missing files, separate Set-Cookie headers, redirects and
HEAD. The handler itself remains Fetch-native; other runtimes and hosting
providers have not been qualified. Static file middleware needs Node filesystem
compatibility and is not an edge storage abstraction.

## Release prerequisite

The new package needs the one-time npm stub and trusted-publisher setup from
[releases](../releases.md#add-a-publishable-package) before automated publishing.
Local implementation and package validation do not provision npm publishing.

## Lazy route preparation and hydration

Generated file-route catalogs carry a module loader identity rather than eagerly
imported screens. Preparation imports and normalizes the module before search,
guards and data. The shared weak cache stores module definitions only; snapshots
retain its identity, while replacement catalogs receive independent identities.
Cancellation settles individual callers without aborting a shared import. Failures
are evicted so a later navigation can retry (the JS runtime may itself cache
module evaluation failures). Rendering resolves the loaded screen without wrapping
or directly calling its component function. Browser bootstrap warms the initial
module before hydration, without repeating transferred preparation.

Layouts remain eager because the root shell is consumed before navigation.
Markdown/baked content and explicitly imported programmatic catalogs retain their
existing behavior. Importing a route through another eager module also makes it
eager; lazy loading itself is not a server-code boundary; the explicit boundary below is separate. `manifestToJson` does not import
code: unloaded routes report `moduleLoaded: false` and omit unknown callback flags.
Generated build-time JSON still has complete static discovery metadata.

Flamefront's `src/vite.ts` route preloader and `src/route-prefetch.ts` informed the
separation of code warming from data fetching. Xplat deliberately adds no data
prefetch cache or freshness/authorization policy in this feature.

Platform source evidence: NativeScript Vite 8.0.20 uses its
`helpers/dynamic-import-plugin.ts` to replace browser preload handling and rewrite
chunk imports for the device loader. AppKit's Xplat preset sets
`codeSplitting: false` for its single-bundle JavaScriptCore host; GTK similarly
inlines imports. These are bundler policies, not guarantees of deferred module
evaluation or smaller startup bundles on every host. The macOS harness bundle builds with the generated lazy catalog after preparing
the Tiptap, Lexical and richtext `build:assets` tasks through Turbo. Its output
is one `app.js` bundle. New native device runtime qualification has not been
performed for this feature.

## Explicit server-code boundary

The shared build utility `@octane-xplat/lib/server-boundary` runs after source
compilation in `webHost()` and `xplatBoundary()`. It removes named re-exports whose
resolved source is a `.server` module/directory. Direct or dynamic imports and
export-star paths fail closed in clients, while SSR preserves the module graph.
This explicit syntax avoids treating Xplat's ordinary cross-platform loaders as
server callbacks or inferring which authored side effects can be deleted. It is
not an RPC layer. Residual uses of removed exports fail normal module linking.
Production maps omit authored sources; maps for transformed dev modules break
the original-source chain. Build and Vite development regressions inspect both
emitted code and maps for fixture sentinels. No actual credentials are fixtures.
