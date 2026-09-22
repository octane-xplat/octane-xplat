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
  both watch the same `src/`/`packages/` trees. One save should hot-update
  both targets (verify in prototype — two vite instances on one watcher set).
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

## CI shape

1. `tsc --noEmit -p tsconfig.web.json` + `-p tsconfig.native.json`
2. `vitest` shared/logic + web component tests
3. `vite build` (web)
4. `ns build ios|android` (macOS runner; can gate on label early on)
5. Native unit tests (driver-level) via vitest mock driver; on-device smoke
   manual until e2e story exists (testing.md)
