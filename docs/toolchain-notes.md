# Toolchain notes

> **Filename update (2026-09-28):** the app shell now lives in `apps/mobile`; current module suffix rules are in [module resolution](module-resolution.md). Historical build notes below may use the former `.native` suffix.

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
| Resolver       | `.web` chain                          | `.ios`→`.mobile`→unsuffixed                                         | `.android`→`.mobile`→unsuffixed |
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
  `handleHotUpdate` — the save is dropped _silently_, no log line. Harness
  fix: `apps/mobile/tsconfig.json` maps `@xplat/app`, `@xplat/demos`,
  `@octane-xplat/ui`, and `@octane-xplat/platform`. `xplat doctor` warns when
  an imported workspace package is missing from `paths`.
- `recipients=N` in `[hmr-ws][update]` counts attached `/ns-hmr` websocket
  clients (real count via the `vite-octane` patch). `recipients=0` means the
  broadcast reached nobody — the device stays stale with no error.
- The ws client attaches only on the `ns run`-initiated launch. A manual
  `xcrun simctl launch` still boots dev-session modules (HTTP ESM works —
  `[probe]`/`[demo]` logs flow) but no ws client attaches, so subsequent
  saves report `recipients=0`. Android is stricter: a manual `am start`
  boots the _inlined bundle_ with no HTTP boot at all. Restore HMR by
  relaunching through `ns run`.
- Element registry modules self-accept (`import.meta.hot?.accept()`) so
  re-registration recreates live native instances without remount.
- **HMR model verified**: every component module self-accepts via
  `hmrUniversalComponent`; named and default exports both hot-swap; edits
  propagate to the nearest accepting importer; entry edits reload the module
  graph in-process. Named exports remain convention (hygiene), not a hard
  requirement.
- NativeScript Vite 8.0.17 fixes percent-encoded path-style `/ns/m` and Vue
  `/ns/sfc` requests (NativeScript/NativeScript#11483). The stable Vite patch
  no longer carries those decoding changes; it remains for the unrelated
  resolver, dependency-bundle, and `.mobile` suffix fixes.

### Dev-loop troubleshooting

| Symptom                                             | Cause                                                            | Fix                                                                                          |
| --------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Save logs no `[hmr-ws][update]` at all              | File outside HMR scope — not in app src or tsconfig `paths`      | Map the package in the native app's tsconfig `paths` (`xplat doctor` flags it)               |
| Update logs `recipients=0`, device stays stale      | No `/ns-hmr` ws client attached                                  | Relaunch via `ns run` (manual `simctl`/`am start` doesn't reattach); see below               |
| `recipients=0` right after a manual device relaunch | ws attach requires the livesync-driven launch                    | `ns run ios` / `ns run android` again                                                        |
| `recipients=0` on physical Android                  | `adb reverse` mapping died (adbd restart) or missing ws plugin   | `adb reverse tcp:<vite-port> tcp:<vite-port>`; declare `@valor/nativescript-websockets`      |
| Web changes its port unexpectedly                   | Native dev server prefers `:5173`; whichever starts second bumps | Pin the web `server.port` (harness uses `5200`); device always self-discovers                |
| `HTTP import failed … %5B` in device boot log       | `/ns/m` doesn't decode bracketed route filenames                 | Patched locally + filed as NativeScript#11455; drop the patch when a release carries the fix |
| Two checkouts' `ns run` sessions interfere          | Sim install + `bundle.mjs` injection are shared mutable state    | Serialize `ns run` per simulator; concurrent runs clobber each other's bundle                |

- `.tsrx` everywhere for renderer-owned files; `.ts` helpers
  never call hooks (slotter emits `from 'octane'` — DOM runtime; under a
  universal rule they're _validated_ not compiled).
- Typecheck via `tsrx-tsc --noEmit` per target config (`.tsrx` needs the
  patched tsc).

### Native plugin declaration ownership

Declare the optional UI and platform-service plugin peers in the app’s own
`package.json`. Leaf-owned implementation plugins are different: NativeScript
discovers their real transitive dependencies (decision #51), so apps using
`@octane-xplat/video` or `@octane-xplat/pager` need not redeclare those plugins. `xplat doctor` walks the app source and reachable local workspace
packages, identifies framework imports, and compares the framework's native
plugin metadata with the app's direct dependencies. Missing declarations are
warnings, not a hard failure, because the web target does not need them and
some native capabilities are optional.

The starter declares only the optional UI plugins (`ui-drawer`, plus
`gesturehandler` — see below); svg support is vendored inside
`@octane-xplat/ui` (`src/vendor/ui-svg` submodule — decision #62). It does not seed
every platform service
plugin: apps should add the
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
deliberately. The escape hatch is pnpm `patchedDependencies` — the canonical
set lives in `packages/cli/patches/` (manifest.json + `.patch` files), the
workspace yaml references it directly, and `pnpm sync:patches` /
`pnpm check:patches` keep the published `@octane-xplat/patches` config package
and create template yaml in sync. Fresh scaffolds fetch that package through
`configDependencies`; existing apps materialize patches with
`xplat patches apply` and verify with `xplat patches check` / `xplat doctor`.

When a workspace package's dependency declarations change, resync with
`pnpm install --lockfile-only`; do not hand-edit the importer. The
`packages/lint` importer is the canary for this rule because its `@tsrx/core`
and `oxlint` entries must stay aligned with the published package. The
workspace installs published `octane@0.6.3` with the canonical patch set;
fresh clones and worktrees can use `pnpm install --frozen-lockfile` without
the gitignored `research/` directory.

## Shared packages publish model

Workspace development resolves authored sources and the app compiles them.
Published `@octane-xplat/ui` instead ships **compiled** output. Do not infer
the published file layout from workspace `exports` alone. `packages/ui/vite.config.ts` builds the
package twice in lib mode (`vite build`, `vite build --mode native`) with
`preserveModules`: `.tsrx` → per-module JS under `dist/web` + `dist/native`,
suffix chain resolved at build time, hooks retargeted to
`@nativescript-community/octane`, runtime deps external via peers.
`exports` still point at `src` for workspace dev; `publishConfig` swaps
them to `dist` only at publish. Verified via `pnpm pack` extraction.

**Types:** the classic TS 5.9 `tsrx-tsc` path can emit ordinary `.d.ts`
files from `.tsrx` sources. It preserves explicit `.tsrx` module specifiers,
however, so raw output is not directly consumable without tsrx-aware module
resolution. `tsrx-typegen` runs that declaration emit with the package's own
compiler config and rewrites source extensions to the package's JavaScript
extensions. Generated declarations live in a dedicated output directory and
`--check` detects stale output without touching handwritten types.

### Develop against generated declarations

Generated declarations are build artifacts and are ignored by Git, oxlint,
and oxfmt. Handwritten entry declarations and explicit overrides remain
tracked source. The npm packages include the generated files through their
`files` lists; consumers do not need to run the declaration compiler.

In this repository, a fresh `pnpm install` runs `pnpm typegen` after dependencies are
installed. It generates declarations in workspace dependency order before
editors or linked apps resolve them. If installation used `--ignore-scripts`,
run `pnpm typegen` explicitly before checking or developing a consumer. Use
the same command after cleaning generated files: pnpm can reuse install
lifecycle state and skip an unchanged setup hook on subsequent installs.

The harness web, mobile, macOS, Linux, and Windows development commands start
a declaration watcher before launching the app. The watcher refreshes the
changed package and its workspace dependents after source, handwritten type,
or compiler configuration edits. For an editor-only session or an app linked
to this checkout, keep this command running in the framework repository:

```sh
pnpm typegen:watch
```

Initial generation failure prevents the development command from launching.
A later compiler error is reported while the watcher keeps running; generated
files retain the last successful output until the source is fixed. Restart
the watcher after adding a workspace package or changing its dependency graph.

CI generates declarations before consumer typechecks, validates UI's packed
declaration graph, and checks GIF with plain TypeScript consumers. UI's
packed consumer runs web, native, and macOS targets in Bundler and NodeNext
modes with the create template's per-target `moduleSuffixes`,
`customConditions`, ambient `types`, and `skipLibCheck` — suffixless
`./Icon.js`-style references inside the shared declarations resolve to
`.web`/`.mobile`/`.ios`/`.android` variants only under those suffixes, and
third-party NativeScript ambient declarations carry upstream lib conflicts
that make `skipLibCheck: false` unsupported for consumers.
Declaration-producing packages
run their build from `prepack`, so both `pnpm pack` and publication regenerate
output. To prepare one package's types without building runtime bundles, run
`pnpm --filter <package-name> typegen` after workspace setup.

### Declaration compiler support

`@octane-xplat/ui` now generates declarations for its web, native, Linux, and
iOS/Android subpath entrypoints. Its AppKit root entrypoint keeps an explicit
declaration because that renderer uses separate JSX types; it now references
the generated shared props, and stale `Pager`/`Video` entries were removed
because those components ship from separate leaf packages. This adopts the
same flow the GIF leaf proved in a packed consumer. The TS 7 content-mapper
path has a separate output naming/specifier issue (`Component.d.tsrx.ts` and
retained `.tsrx` imports; upstream
[TS#64053](https://github.com/microsoft/TypeScript/issues/64053) and
[draft TS#64120](https://github.com/microsoft/TypeScript/pull/64120)). The
initial typegen backend targets the classic TS 5.9 path; it does not claim
that the upstream TS 7 issue is fixed.

Packages with `tsrx-typegen.json` can run `tsrx-typegen --pack-check` as a hard
publication gate. It checks every target's generated output, packs a temporary
tarball with lifecycle scripts disabled, validates both workspace and
`publishConfig` export paths against the packed files, compares runtime and
declaration value exports, and checks declaration references and dependencies.
Put the gate in `prepack` after the runtime build so `pnpm pack` and publish use
the same package contents. `xplat doctor`, when invoked at a configured package
root, runs that gate and exits nonzero on failure. A plain TypeScript consumer
fixture remains necessary to check inferred props and module-resolution modes;
the pack gate validates the declaration graph, not every semantic contract.

Every publishable package that ships declarations runs `--pack-check` in
`prepack`. Leaves that emit declarations through plain `tsc`
(`tsconfig.types.json` + committed or generated `types/` output) or publish
handwritten per-platform declarations declare a target with `"emit": false` —
`--pack-check` skips their generation/freshness phase and only validates the
packed package. Such packages must still give every code export branch a
`types` condition (workspace `exports` point at real `.d.ts` files so the
graph is verifiable without building). Handwritten JSX component declarations
use the consumer-facing call signature, matching generated declarations:

```ts
export declare function MaterialDropdown(props: MaterialDropdownProps): unknown
```

`UniversalComponent` describes the compiled renderer's additional context
argument; exposing that required argument rejects ordinary JSX consumers.
Check handwritten component types with the package's `test:packed` fixture.

Source-published leaves
(`@octane-xplat/files`, `media`, `biometrics`, `geolocation`,
`notifications`, `secure-storage`, `sqlite`) ship no declarations at all —
their `exports` resolve `.ts` sources, which a plain bundler-mode
packed-consumer typecheck covers instead of `--pack-check` (the extensionless
specifiers inside shipped sources cannot satisfy NodeNext, and `pack-check`
has no declaration files to verify). `@octane-xplat/platform` is the same
source-published shape plus `.tsrx` entries under its `./*` wildcard, which
pack-check cannot model as declarations.

`@octane-xplat/gif` is the first leaf package using this flow. Its web and
NativeScript declarations are generated and checked from a packed consumer in
Bundler and NodeNext modes with `skipLibCheck: false`. The UI consumer fixture
checks both workspace and publish export maps in those modes; NativeScript's
third-party ambient declarations require `skipLibCheck: true` in its temporary
consumer, while package export paths and declaration closure remain checked by
`--pack-check`. The component and service leaves carry the same harness in
`tests/packed-consumer.mjs` — `pnpm test:packed` runs every package's packed
consumer and `pnpm check:pack` runs every pack-check.

## TS configs

`tsconfig.base.json` + `.web` / `.native` variants differing in
`jsxImportSource`, included globs, and ambient types (`@nativescript/types`
scoped to native). `tsrx-tsc --noEmit` per target in CI.
See module-resolution.md for the suffix-typing strategy.

## Native app plumbing

- `nativescript.config.ts`, `App_Resources/` (icons, splash, fonts, strings,
  entitlements), `platforms/` generated — live in `apps/mobile`.
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

## Driver fixes shipped upstream in 0.2.1

All three driver fixes we reported upstream shipped in
`@nativescript-community/octane@0.2.1`; those original local fixes were
removed. A separate retained patch is described below:

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

### Retained driver patch

`packages/cli/patches/@nativescript-community__octane@0.2.4.patch` skips
`undefined` prop writes in the driver's `setProp` — NativeScript native
setters coerce it (e.g. `editable` → `ios.userInteractionEnabled = NO`),
leaving dead UI that still has its JS listeners. The root applies it through
`pnpm-workspace.yaml` `patchedDependencies`; downstream apps can materialize
it with `xplat patches apply`. The patch manifest records its scope and drop
condition.

## CI shape

`.github/workflows/ci.yml` gates on push and PR. The `checks` job runs, in
order: `pnpm lint` (oxlint + tsrx pass + recipes + css), `check:patches` /
`check:css` / `check:recipes` / `check:decisions` /
`check:suffix-resolution`, `pnpm typecheck:web`, `pnpm typecheck:mobile`,
`pnpm test`, `pnpm build:web`, the publishable-package builds,
`tsrx-typegen --pack-check` + the GIF packed consumer, the harness browser
smoke (`pnpm --filter @xplat/web smoke`, 59 assertions on the production
bundle), and `pnpm check:consumer --no-build --smoke web`. `check:no-dom`
is the older static sweep; `xplat/no-dom-globals` covers it at lint time.

`scripts/verify-consumer.mjs` (`check:consumer`) is the release-path
verification: it `pnpm pack`s every publishable package, scaffolds a starter
through the PACKED `create-octane-xplat` bin (`--no-install`), rewrites the
consumer's `@octane-xplat/*` deps to `file:` tarballs plus a materialized
`node_modules/.pnpm-config` (pnpm's `configDependencies` requires exact
registry semver — a local tarball can't substitute), installs outside the
workspace, and asserts the resolved packages are real packed payloads before
running the consumer's own lint/typecheck/build/doctor. Flags: `--no-build`,
`--smoke web`, `--native ios,android`, `--smoke-ios`, `--keep`,
`VERIFY_CONSUMER_DIR`. A `--native` target additionally runs
`ns build <platform>` inside the consumer; `--smoke-ios` boots an iPhone sim
and `simctl install`/`launch`es the debug `.app`, failing on crash or
JS-error log output. These produce debug/simulator artifacts — build-check
and runtime-boot evidence, not signed store distribution.

Slow target jobs run on main pushes only: `native-ios` (macos-latest) and
`native-android` (ubuntu-latest with Temurin JDK 21) each wrap their run in
`scripts/with-target-lock.mjs <target>` — a per-target advisory lock under
`$TMPDIR/octane-xplat-target-locks/` that serializes native builds and
simulator/device use across concurrent worktrees and sessions on a shared
host. Android has no emulator runtime smoke yet.

The final `evidence` job (`needs` the three gate jobs) writes
`ci-evidence-<sha>.json` recording each required job's result for the tested
sha and uploads it as workflow artifact `ci-evidence-<sha>`. The required-job
list lives once in `scripts/verify-release-evidence.mjs`.

`release.yml` publishes only what CI tested: both publish jobs check out
`workflow_run.head_sha` (not current main), run
`verify-release-evidence.mjs verify` to fetch and assert the matching
artifact, and abort the tag push if `TESTED_SHA..origin/main` contains any
non-release-bot commit — a moved main ships nothing untested.
`pnpm check:consumer` can run the same packed-consumer path locally before
pushing.
