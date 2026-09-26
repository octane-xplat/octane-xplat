# Toolchain notes

> Detailed build and release record. Two builds, one tree. The dev loop should feel like one project even though
> it is two pipelines.
>
> **Owns:** #7 version matrix & patches · **Status:** matrix defined ·
> **Blocks on:** Q17 · **Decisions:** #15 (+ invariant #3, single octane
> copy) · **Validated by:** web `vite` + `ns run ios` running concurrently off
> one tree, one `.tsrx` save broadcasting to both (lab-experiment, iPhone 17
> Pro sim, 2026-09-25).

## Build matrix

|                | Web                                   | iOS                                                            | Android                    |
| -------------- | ------------------------------------- | -------------------------------------------------------------- | -------------------------- |
| Bundler        | vite + `@octanejs/vite-plugin`        | `@nativescript/vite` + `vite-octane`                           | same                       |
| Renderer scope | DOM renderer owns all component files | `nativeScriptRenderers` owns all component files               | same                       |
| Entry          | `main.web.ts` → `createRoot`          | `main.native.ts` → `Application.run` + `renderNativeScriptApp` | same                       |
| Resolver       | `.web` chain                          | `.ios`→`.native` chain                                         | `.android`→`.native` chain |
| HMR            | vite dev server                       | on-device via HTTP ESM + `hmrUniversalComponent`               | same                       |
| Output         | static site / SSR server              | `.app`/`.ipa`                                                  | `.apk`/`.aab`              |

## Dev loop

- `vite dev` (web) + `ns run ios` / `ns run android` run concurrently against
  the same tree — **verified** (lab-experiment, iOS sim): three vite
  processes coexist — web on `:5200` (pinned in `apps/web/vite.config.ts`)
  plus, per native target, `vite serve` (the device-facing dev server) and a
  `vite build --watch` bundle emitter. The ns server prefers `:5173` and
  auto-bumps on collision (the device discovers the actual port from synced
  app metadata, not a hardcoded value — measured: server on `:5174`, device
  HMR still connects). No watcher contention: each vite keeps its own
  chokidar watch on the shared `src/`/`packages/` trees; the duplicated fs
  watch is the only cost.
- One save hot-updates every running target independently — verified: a
  `packages/demos` `.tsrx` edit broadcast `[hmr-ws][update] … recipients=1`
  to the device while the web server transformed the same module.
- **Native HMR scope is an allowlist** (upstream `getHmrSourceRoots` in
  `@nativescript/vite`): the app source dir + the roots named in the app's
  tsconfig `compilerOptions.paths`. A workspace package that is imported but
  absent from `paths` builds and serves fine, but edits to it never reach
  `handleHotUpdate` — the save is dropped *silently*, no log line. Harness
  fix: `apps/native/tsconfig.json` maps `@xplat/app`, `@xplat/demos`,
  `@octane-xplat/ui`, and `@octane-xplat/platform`. `xplat doctor` warns when
  an imported workspace package is missing from `paths`.
- `recipients=N` in `[hmr-ws][update]` counts attached `/ns-hmr` websocket
  clients (real count via the `vite-octane` patch). `recipients=0` means the
  broadcast reached nobody — the device stays stale with no error.
- The ws client attaches only on the `ns run`-initiated launch. A manual
  `xcrun simctl launch` still boots dev-session modules (HTTP ESM works —
  `[probe]`/`[demo]` logs flow) but no ws client attaches, so subsequent
  saves report `recipients=0`. Android is stricter: a manual `am start`
  boots the *inlined bundle* with no HTTP boot at all. Restore HMR by
  relaunching through `ns run`.
- Element registry modules self-accept (`import.meta.hot?.accept()`) so
  re-registration recreates live native instances without remount.
- **HMR model verified**: every component module self-accepts via
  `hmrUniversalComponent`; named and default exports both hot-swap; edits
  propagate to the nearest accepting importer; entry edits reload the module
  graph in-process. Named exports remain convention (hygiene), not a hard
  requirement.
- Known upstream wart: a dynamic route file with `[param]` brackets
  (`app/demo/[id].tsrx`) logs a bootstrap failure at device boot — the
  module-graph walk misses it, the blocking fallback fetch encodes
  `[`/`]` as `%5B%5D`, and the `/ns/m` handler doesn't decode, so the
  prefetch 404s. The session still boots and HMR works; the lazy route
  payload itself is what fails to load. `@nativescript/vite` decode gap —
  filed as NativeScript/NativeScript#11455.

### Dev-loop troubleshooting

| Symptom                                                         | Cause                                                            | Fix                                                                                |
| --------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Save logs no `[hmr-ws][update]` at all                          | File outside HMR scope — not in app src or tsconfig `paths`      | Map the package in the native app's tsconfig `paths` (`xplat doctor` flags it)     |
| Update logs `recipients=0`, device stays stale                  | No `/ns-hmr` ws client attached                                  | Relaunch via `ns run` (manual `simctl`/`am start` doesn't reattach); see below     |
| `recipients=0` right after a manual device relaunch             | ws attach requires the livesync-driven launch                    | `ns run ios` / `ns run android` again                                              |
| `recipients=0` on physical Android                                | `adb reverse` mapping died (adbd restart) or missing ws plugin   | `adb reverse tcp:<vite-port> tcp:<vite-port>`; declare `@valor/nativescript-websockets` |
| Web changes its port unexpectedly                                 | Native dev server prefers `:5173`; whichever starts second bumps | Pin the web `server.port` (harness uses `5200`); device always self-discovers      |
| `HTTP import failed … %5B` in device boot log                   | `/ns/m` doesn't decode bracketed route filenames                 | Upstream bug (NativeScript#11455); session still boots — ignore unless the lazy route is needed |
| Two checkouts' `ns run` sessions interfere                      | Sim install + `bundle.mjs` injection are shared mutable state    | Serialize `ns run` per simulator; concurrent runs clobber each other's bundle      |
- `.tsrx` everywhere for renderer-owned files; `.ts` helpers
  never call hooks (slotter emits `from 'octane'` — DOM runtime; under a
  universal rule they're _validated_ not compiled).
- Typecheck via `tsrx-tsc --noEmit` per target config (`.tsrx` needs the
  patched tsc).

### Native plugin declaration ownership

NativeScript's module and plugin discovery happens from the app's own
`package.json`; a plugin that exists only as a transitive dependency of
`@octane-xplat/ui` or `@octane-xplat/platform` is not a supported app
declaration. `xplat doctor` walks the app source and reachable local workspace
packages, identifies framework imports, and compares the framework's native
plugin metadata with the app's direct dependencies. Missing declarations are
warnings, not a hard failure, because the web target does not need them and
some native capabilities are optional.

The starter declares the UI plugin set (`ui-canvas`, `ui-drawer`, and
`ui-svg`). It does not seed every platform service plugin: apps should add the
plugins for the services they import, and `doctor` names the missing package.
`@nativescript-community/gesturehandler` is also required: `Drawer.native`
eagerly imports `ui-drawer`, which eagerly imports gesturehandler, whose iOS
code reads the `GestureHandlerDelegate` ObjC protocol at module load — a
protocol that exists only when the plugin's `platforms/ios` sources are
compiled in, which requires a top-level app declaration. The starter and
`@octane-xplat/ui`'s optional peers both carry it, so `doctor` reports it
when an app omits it.
The proving app may therefore carry plugins that a particular screen does not
render; that is an app ownership concern, not evidence that the framework
should make those plugins transitive.

### Editor diagnostics and typecheck authority

The repository's authoritative type lane is `tsrx-tsc --noEmit` under the web
and native app configs. The `@tsrx/oxc` editor server is an OXC parser/linter
lane, not a TypeScript semantic checker. Capturing diagnostics from the
checked-in `@tsrx/oxc` 0.13 server for the two List leaves produced only
`oxlint-tsrx` `curly` diagnostics in `List.web.tsrx` (the unbraced `if`/`else`
statements) and no diagnostics in `List.native.tsrx`; it produced no TypeScript
type errors. The server also reported one unmapped projected-plugin notice.
Both `tsrx-tsc --noEmit -p apps/web/tsconfig.json` and the native equivalent
pass, so there is no real List typing defect to patch. Treat an OXC editor
lint finding as a lint/configuration issue and use the dual `tsrx-tsc` lane to
decide whether a reported TypeScript error is real.

## Version pinning matrix (hard requirement)

| Pin                                                                    | Constraint                                                                                          |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `octane`                                                               | single copy per app — dedupe via package-manager `resolutions`/overrides                            |
| `@octanejs/vite-plugin`                                                | declares the `octane` range it compiles for (0.1.52 ↔ octane 0.2.x) — must bracket the app's octane |
| `@nativescript-community/octane`                                       | peer `octane >= 0.1.51`; `@nativescript/core >= 9.1`                                                |
| `@nativescript/core`, runtimes (`ios`/`android`), `@nativescript/vite` | NS 9.1+ for HTTP ESM dev boot                                                                       |
| Node                                                                   | `>= 22.22.2` for published Octane packages                                                          |

Expect churn: octane is beta, the NS port is days old. Pin exact versions, bump
deliberately, keep `patches/` (patch-package) as an accepted escape hatch —
ns-octane already does this.

When a workspace package's dependency declarations change, resync with
`pnpm install --lockfile-only`; do not hand-edit the importer. The
`packages/lint` importer is the canary for this rule because its `@tsrx/core`
and `oxlint` entries must stay aligned with the published package. A resync in
a linked worktree can rewrite the local octane tarball as a worktree-relative
`file:` path. That is incidental checkout-local churn: restore it before
committing, since the path is not valid from another checkout. Fresh worktrees
without the local pack should bootstrap with `pnpm install --lockfile=false`,
then resync once the pack is available.

## Shared packages publish model

Octane's model: packages ship **authored source**; the consuming app compiles
them against its own runtime. So `packages/ui` etc. export `.tsrx`/`.tsx`
sources + types, and each app's renderer include glob covers `packages/**`.
No prebuild step for shared code; hook rule (invariant #2) applies inside
packages too.

**In practice:** for `@octane-xplat/ui` we diverged — it ships
**compiled** output, not source. `packages/ui/vite.config.ts` builds the
package twice in lib mode (`vite build`, `vite build --mode native`) with
`preserveModules`: `.tsrx` → per-module JS under `dist/web` + `dist/native`,
suffix chain resolved at build time, hooks retargeted to
`@nativescript-community/octane`, runtime deps external via peers.
`exports` still point at `src` for workspace dev; `publishConfig` swaps
them to `dist` only at publish. Verified via `pnpm pack` extraction.

**Types — hand-written boundary `.d.ts`:** `tsrx-tsc` on TS 5.9 has no
declaration emit; the TS-7 native path emits `Component.d.tsrx.ts`,
which needs `allowArbitraryExtensions` on the consumer (upstream:
[tsrx#136](https://github.com/tsrx-org/tsrx/issues/136) →
microsoft/TypeScript#64120 + #64053). Workaround shipped:
`packages/ui/types/index.d.ts` covers the whole public surface — the API
is platform-uniform by design, so one file serves both `web`/`native`
conditions via a `types` condition in `publishConfig`. Verified against
the packed tarball with a `customConditions:['web']` consumer tsconfig.
Cost: drift risk vs the `.tsrx` prop types — the file sits next to the
leaves; update it when props change.

## TS configs

`tsconfig.base.json` + `.web` / `.native` variants differing in
`jsxImportSource`, included globs, and ambient types (`@nativescript/types`
scoped to native). `tsc --noEmit` per target in CI.
See module-resolution.md for the suffix-typing strategy.

## Native app plumbing

- `nativescript.config.ts`, `App_Resources/` (icons, splash, fonts, strings,
  entitlements), `platforms/` generated — live in `apps/native`.
- Xcode + Android SDK toolchains; CocoaPods via NS CLI. Signing/profiles per
  usual native workflow — CI needs macOS runners for iOS builds.
- Distribution: no EAS equivalent — `ns build ios --release` + fastlane or
  Xcode Cloud; Play: `ns build android --release` + Play publishing lane.
- OTA/updates: NS supports app-resource-level sync only — treat as later.

## Environment config

Per-target `import.meta.env` defines (`__PLATFORM__`, dev/prod). Keep the
`.env` story boring: `.env` shared, `.env.web`/`.env.native` overrides; never
ship secrets into either bundle (native bundles are inspectable like web).

## Bundle contents (verified on iOS prod + dev)

- **Production (`ns build ios`)**: `vendor.mjs` contains zero DOM octane
  modules — no `dom-bindings`, `dom-stage`, `dom-tables`, `hydration/*`,
  `server-rpc-*`, `runtime.js`. Compiled `.tsrx` references
  `@nativescript-community/octane` → `octane/universal/native` only, so
  tree-shaking works. The one `document.createElement` in vendor.mjs is a
  `WKUserScript` string literal inside `@nativescript/core`'s WebView impl.
- **Dev (`deps-bundle-ios-*.mjs`)**: eagerly vendors every `package.json`
  dep root + the persisted boot closure → `octane/dist/index.js` (full DOM
  graph: 86 modules incl. `runtime.js`, `dom-*`, `hydration/*`) ships to
  the device. Wasteful but dev-only; the vendor collector resolves package
  roots so it can't be excluded per-module. `resolve.alias` maps bare
  `'octane'` → `'octane/universal/native'` in the native app config so any
  uncompiled import lands on the lean entry. Reported:
  [NativeScript/NativeScript#11440](https://github.com/NativeScript/NativeScript/issues/11440).

## TSRX language spec

The canonical syntax reference is the tsrx spec
([github.com/tsrx-org/tsrx](https://github.com/tsrx-org/tsrx); the site is tsrx.dev). Notable rules
that affect our leaves:

- `@{…}` bodies: setup statements first, then **exactly one output node**
  (element, fragment, or `@if`/`@for`/`@try` control flow). Text, bare
  `{expr}` containers, and siblings all need a `<>` wrapper — a bare
  `{expr}` tail silently renders nothing (no diagnostic).
- `@for` supports `index i; key item.id` and an `@empty {}` fallback.
  `key` is optional upstream as of `universal-for-optional-key` (unreleased;
  octane ≤0.4.0 still requires it on universal targets): the DOM renderer
  falls back to `item.id ?? item` and universal targets fall back to a
  positional key — fine for static lists, but reorderable stateful rows
  should declare `key` so item state follows the item, not the slot.
- Octane dependency arrays are **compiler-inferred when omitted** —
  `useEffect(() => {…})` needs no `[]`.
- `module server {…}` blocks + `'server'` imports are DOM/SSR-only — never
  in shared or native files.

## Driver deltas — all upstreamed (0.2.1)

All three driver fixes we reported upstream shipped in
`@nativescript-community/octane@0.2.1`; the local `pnpm patch` is deleted:

1. **Managed listview cells** — `renderItem` on `<listview>` makes the driver
   own `itemTemplate`/`itemLoading`: per-cell `ContentView` + universal root,
   identity-skip rebinds, unmount on release (upstreamed in 0.2.1).
   Upstream's shape is `renderItem`-driven (not our items-splice adapter) —
   `list-view.ts` is the reference.
2. **Prop-write echo suppression** — driver mutes `<prop>Change` during its
   own write via a per-node `muted` set (upstreamed in 0.2.1).
3. **Default renderer validation** — `forbiddenGlobals`/`forbiddenImports`
   ship on `nativeScriptRenderer`, mergeable via
   `nativeScriptRenderers({validation})` (upstreamed in 0.2.1).

**New invariant — one driver copy per app.** Invariant 3 (one `octane`)
applies equally to `@nativescript-community/octane`: the 0.2.0→0.2.1 bump
left `packages/*` devDeps at 0.2.0, so the bundle embedded TWO drivers and
whichever copy created a root owns its prop application — `renderItem`
silently took the old driver's plain `view[name]=` path (no cells, no echo
mute). Symptom: `lv.itemTemplate` undefined + `hasListeners('itemLoading')`
false while `lv.renderItem` held the function. Keep all workspace pins on
the same version; the peer range in `packages/ui` is the contract.

### Retained Suspense compatibility patch

`@nativescript-community/octane@0.2.1` predates the universal runtime's
retained-`@try` visibility commands. The checked-in
`patches/@nativescript-community__octane@0.2.1.patch` supplies the missing
`visibility` capability and maps those commands to NativeScript's
`View.visibility` (`visible`/`collapse`). It also threads `onUncaughtError`
through root creation. Event dispatch failures are reported through that
callback (or rethrown to the host) instead of being logged as “dropped”
events. `apps/native` applies the patch via its `postinstall` hook.

## CI shape

1. `tsc --noEmit -p tsconfig.web.json` + `-p tsconfig.native.json`
2. `pnpm check:no-dom` — static sweep: DOM globals banned in shared +
   `*.native.*`/`*.ios.*`/`*.android.*` source (`scripts/check-no-dom.mjs`).
   Catches leaks at lint time; the renderer's `forbiddenGlobals` is the
   runtime backstop. NS-safe globals (setTimeout/fetch/console/rAF) are
   deliberately not flagged.
3. `vitest` shared/logic + web component tests
4. `vite build` (web)
5. `ns build ios|android` (macOS runner; can gate on label early on)
6. Native unit tests (driver-level) via vitest mock driver; on-device smoke
   manual until e2e story exists (testing.md)
