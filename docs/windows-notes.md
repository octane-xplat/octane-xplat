# Windows target notes

> How `octane-xplat` could gain a Windows desktop target via
> [NativeScript/windows](../prior-art/nativescript-windows.md). Everything here
> is desk-source as of 2026-09-28 — no Windows machine has run any of it.
>
> **Owns:** Windows target seam (new platform, not one of the seven owned
> problems) · **Status:** Path A scaffolded; bundle emits on macOS, unrun on
> Windows · **Blocks on:** Q32–Q35 ·
> **Decisions:** #65 · **Validated by:** queued Silo experiments (WinUI3 host
> boot under pkg.pr.new builds; WinUI3-from-Node via `windows-napi`).

## The fork in the road

Two structurally different integrations are possible:

- **Path A — upstream core platform.** `NativeScript/NativeScript#11272` adds
  `index.windows.ts` for the whole widget surface over `Microsoft.UI.Xaml`,
  plus `windows` support in `@nativescript/vite` (the `/ns/m` HTTP-ESM +
  websocket HMR contract the windows runtime reimplements) and an open
  `nativescript-cli#6065`. `@nativescript-community/octane`'s driver imports
  core view classes with no platform branching, so on this path Windows is
  "the native default that also runs on desktop" — zero renderer code from us.
- **Path B — Node-API host (the macOS pattern).** A `node` process loads
  `@nativescript/windows-napi` and we write a driver for the universal-root
  contract, like `apps/macos/src/renderer`. Headless UI is proven only for
  `Windows.UI.Composition` (Win32 HWND + compositor visuals — a fully
  self-drawn renderer; text/inputs need Win2D/DirectWrite interop).
  `Microsoft.UI.Xaml` from a bare Node host is unproven. The napi package is
  also not yet published — building it needs Rust + MSVC.

Path A is the plan (#65, provisional): it inherits real WinUI 3 controls, the
existing vite dev pipeline, and the unsuffixed native leaf set. Path B stays warm as
the fallback and doubles as the bring-up spike — its cheapest experiment
("does `Microsoft.UI.Xaml` activate under `node` + `windows-napi`?") also
derisks how much of A we could self-host if upstream stalls.

## What integration touches (Path A)

| Layer | Change |
| --- | --- |
| Suffix lattice | `.windows.*` joins the extension chain ahead of the unsuffixed native default in `packages/cli/src/vite.mjs` (`xplatNative` gains a `windows` platform branch — `.mobile` stays ios/android-only); `./windows` subpath on `@octane-xplat/ui`; `moduleSuffixes` in app tsconfigs |
| App shell | `@nativescript/windows` devDep + `windows` block in `nativescript.config.ts`; `App_Resources/Windows` scaffold (Package.appxmanifest, assets, `app.csproj` — upstream ships the template) |
| Leaves | Unsuffixed (native-default) files compile for Windows by default; `.windows` overrides only where behavior diverges. NS plugins we depend on have no windows impl — leaf packages need `.windows` `Unsupported` fallbacks, same pattern as `.macos` |
| CLI | `targets.mjs`: `windows` kind — `ns run windows` already works on the dev-tag CLI (`nativescript@9.1.2-dev.*`, proven by upstream's starter); released CLI waits on cli#6065. `doctor`: `win32` host, Windows 10 1809+, .NET 10 SDK, Developer Mode enabled, `@nativescript/windows` exact pin — mirroring `ns doctor windows` |
| Lint | `isNativeFile` learns `windows`; platform-subpath rules gain `./windows` |
| Packaging | MSIX via `makeappx`/`signtool` (self-signed for dev), or unpackaged exe + WASDK bootstrapper; `app.nsbundle` for source protection. CI: `windows-latest` runners — no cross-compile |
| Runtime supply chain | `@nativescript/windows` is days old → `minimumReleaseAgeExclude` entry, same precedent as the octane packages |

## Open risks

- **Merge risk.** #11272 is 279 files / +183k and a maintainer has already
  asked for it to be split. Until core ships a `windows` platform in a release,
  we prototype on pkg.pr.new previews — unmerged upstream is the schedule risk,
  not a design risk. The usable pin is `@11468` (the feat/windows branch plus a
  percentage-size fix), per the starter template.
- **Version skew.** Upstream's own template pins `@nativescript/windows` exact
  (caret matches incompatible older betas) and forces the PR core through npm
  `overrides` — our equivalent is `pnpm.overrides` in `pnpm-workspace.yaml`.
- **Desktop semantics.** `Frame`/`Page` and `openWindow` (#59) on a real
  multi-window OS; safe-area/status-bar services mostly reduce to no-ops;
  `KeyboardAvoiding` stays in the common root API and uses a neutral column
  wrapper without keyboard adjustment.
- **Verification surface.** The parity sweep (`apps/macos/scripts/parity.mjs`
  pattern) needs a Windows driver-side twin; geometry baselines will differ
  from both web and mobile.

## Spike state (2026-09-28, macOS-side only)

Landed and verified on the macOS host — nothing has run under Windows yet:

- `apps/windows` scaffold: nativescript.config, `xplatNative` vite config with
  `resolve.dedupe` on `@nativescript/core` (workspace packages' 9.1.2 devDeps
  otherwise resolve a second core copy from inside `packages/*`), tsconfig
  `paths` pinning the app core for the same reason, the harness entry from
  `apps/mobile`, and `App_Resources/Windows` from upstream's starter.
- `@nativescript/core` + `@nativescript/vite` pinned to pkg.pr.new `@11468`
  builds; `@nativescript/windows` exact `0.1.0-alpha.144`; dev-tag CLI
  `nativescript@9.1.2-dev.2026-09-24-*`. Preview-version patch twins carry
  the dev-serving fixes (`@nativescript__vite@8.0.13.patch` — /ns/m re-export
  records, vendor-manifest gating, specifier decoding) and the shared-file
  subset of the core patch (`@nativescript__core@9.1.3-next.2.patch` — @layer
  CSS machinery, #11446 frame/tab-view common, flexbox common); the
  iOS/Android impl hunks are dead code on windows and were not ported.
- `xplatNative` extension chain + flag detection gained `windows`;
  `xplat routes` emits `routes.gen.windows.ts` (prefer `['windows']`, with unsuffixed fallback);
  `xplat dev`/`build`/`doctor` discover the target via the declared
  `@nativescript/windows` devDep.
- `vite build` for windows resolves `.windows` → unsuffixed leaves correctly
  (`filepick.windows.ts` lands). Bundle completion is blocked by four
  expected gaps: `guides.tsrx` (module-scope JSX — the universal-compiler
  limitation that fails all native bundle builds on main), `Meter.tsrx`'s
  explicit `./svg.mobile` side-effect import, and `./CameraView` /
  `./variant-demos` which only have ios/android/web/macos twins — the first
  `.windows` fallback leaves.

Still needed on a win32 host: `dotnet build`/`ns run windows` end-to-end
(Q32), the sweep, and per-seam `.windows` leaves where the native default diverges.
