# Toolchain & build

> Two builds, one tree. The dev loop should feel like one project even though
> it is two pipelines.
>
> **Owns:** #7 version matrix & patches · **Status:** matrix defined ·
> **Blocks on:** Q12, Q17 · **Decisions:** #15 (+ invariant #3, single octane
> copy) · **Validated by:** web dev + `ns debug` running off one tree, both
> hot-updating on one save.

## Build matrix

| | Web | iOS | Android |
|---|---|---|---|
| Bundler | vite + `@octanejs/vite-plugin` | `@nativescript/vite` + `vite-octane` | same |
| Renderer scope | DOM renderer owns all component files | `nativeScriptRenderers` owns all component files | same |
| Entry | `main.web.ts` → `createRoot` | `main.native.ts` → `Application.run` + `renderNativeScriptApp` | same |
| Resolver | `.web` chain | `.ios`→`.native` chain | `.android`→`.native` chain |
| HMR | vite dev server | on-device via HTTP ESM + `hmrUniversalComponent` | same |
| Output | static site / SSR server | `.app`/`.ipa` | `.apk`/`.aab` |

## Dev loop

- `vite dev` (web) + `ns debug ios` / `ns debug android` — run concurrently;
  both watch the same `src/`/`packages/` trees. **Verified**: two vite
  instances coexist against the shared sources — web pinned to `:5200`
  (`server.port` in `apps/web/vite.config.ts`); the ns server prefers
  `:5173` and auto-bumps on collision (the device discovers the actual
  port from synced app metadata, not a hardcoded value — measured: server
  on `:5174`, device HMR still connects).
- Element registry modules self-accept (`import.meta.hot?.accept()`) so
  re-registration recreates live native instances without remount.
- **HMR model verified**: every component module self-accepts via
  `hmrUniversalComponent`; named and default exports both hot-swap; edits
  propagate to the nearest accepting importer; entry edits reload the module
  graph in-process. Named exports remain convention (hygiene), not a hard
  requirement.
- `.tsrx` everywhere for renderer-owned files (decision #23); `.ts` helpers
  never call hooks (slotter emits `from 'octane'` — DOM runtime; under a
  universal rule they're *validated* not compiled).
- Typecheck via `tsrx-tsc --noEmit` per target config (`.tsrx` needs the
  patched tsc).

## Version pinning matrix (hard requirement)

| Pin | Constraint |
|---|---|
| `octane` | single copy per app — dedupe via package-manager `resolutions`/overrides |
| `@octanejs/vite-plugin` | declares the `octane` range it compiles for (0.1.52 ↔ octane 0.2.x) — must bracket the app's octane |
| `@nativescript-community/octane` | peer `octane >= 0.1.51`; `@nativescript/core >= 9.1` |
| `@nativescript/core`, runtimes (`ios`/`android`), `@nativescript/vite` | NS 9.1+ for HTTP ESM dev boot |
| Node | `>= 22.22.2` for published Octane packages |

Expect churn: octane is beta, the NS port is days old. Pin exact versions, bump
deliberately, keep `patches/` (patch-package) as an accepted escape hatch —
ns-octane already does this.

## Shared packages publish model

Octane's model: packages ship **authored source**; the consuming app compiles
them against its own runtime. So `packages/ui` etc. export `.tsrx`/`.tsx`
sources + types, and each app's renderer include glob covers `packages/**`.
No prebuild step for shared code; hook rule (invariant #2) applies inside
packages too.

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

## Bundle contents (Exp 4 — verified iOS prod + dev)

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

The canonical syntax reference is `research/tsrx/website-tsrx/public/llms.txt`
(local clone of github.com/tsrx-org/tsrx; the site is tsrx.dev). Notable rules
that affect our leaves:

- `@{…}` bodies: setup statements first, then **exactly one output node**
  (element, fragment, or `@if`/`@for`/`@try` control flow). Text, bare
  `{expr}` containers, and siblings all need a `<>` wrapper — a bare
  `{expr}` tail silently renders nothing (no diagnostic).
- `@for` supports `index i; key item.id` and an `@empty {}` fallback.
- Octane dependency arrays are **compiler-inferred when omitted** —
  `useEffect(() => {…})` needs no `[]`.
- `module server {…}` blocks + `'server'` imports are DOM/SSR-only — never
  in shared or native files.

## Driver patches (pnpm patch → fork PRs)

`patches/@nativescript-community__octane.patch` carries three driver-level
fixes (decision #26 — the fork `aleclarson/nativescript-octane` is where
they'll land as PRs):

1. **Managed `items` on `listview`** — plain array → driver-owned
   ObservableArray; identity change → splice + microtask `refresh()`.
   (upstream: nativescript-community/octane#1)
2. **Prop-write echo suppression (general)** — any driver prop write drops
   its own `<prop>Change[d]` echo: `text`→`textChange`, `checked`→
   `checkedChange`, `selectedIndex`→`selectedIndexChanged`. Verified on
   TextField, Switch, and TabView (each produced double events before).
   (upstream: nativescript-community/octane#3)
3. **Default renderer validation** — `forbiddenGlobals`/`forbiddenImports`
   ship on `nativeScriptRenderer`. (upstream: octane#2)

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
