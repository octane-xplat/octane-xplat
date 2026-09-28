# Windows target notes

> How `octane-xplat` could gain a Windows desktop target via
> [NativeScript/windows](../prior-art/nativescript-windows.md). Everything here
> is desk-source as of 2026-09-28 — no Windows machine has run any of it.
>
> **Owns:** Windows target seam (new platform, not one of the seven owned
> problems) · **Status:** mapped at source level · **Blocks on:** Q32–Q35 ·
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
  "`.native` that also runs on desktop" — zero renderer code from us.
- **Path B — Node-API host (the macOS pattern).** A `node` process loads
  `@nativescript/windows-napi` and we write a driver for the universal-root
  contract, like `apps/macos/src/renderer`. Headless UI is proven only for
  `Windows.UI.Composition` (Win32 HWND + compositor visuals — a fully
  self-drawn renderer; text/inputs need Win2D/DirectWrite interop).
  `Microsoft.UI.Xaml` from a bare Node host is unproven. The napi package is
  also not yet published — building it needs Rust + MSVC.

Path A is the plan (#65, provisional): it inherits real WinUI 3 controls, the
existing vite dev pipeline, and the `.native` leaf set. Path B stays warm as
the fallback and doubles as the bring-up spike — its cheapest experiment
("does `Microsoft.UI.Xaml` activate under `node` + `windows-napi`?") also
derisks how much of A we could self-host if upstream stalls.

## What integration touches (Path A)

| Layer | Change |
| --- | --- |
| Suffix lattice | `.windows.*` joins the extension chain ahead of `.native.*` in `packages/cli/src/vite.mjs` (`xplatNative` gains a `windows` platform branch); `windows` export condition + `./windows` subpath on `@octane-xplat/ui`; `customConditions`/`moduleSuffixes` in app tsconfigs |
| App shell | `@nativescript/windows` devDep + `windows` block in `nativescript.config.ts`; `App_Resources/Windows` scaffold (Package.appxmanifest, assets, `app.csproj` — upstream ships the template) |
| Leaves | `.native` files compile for Windows by default; `.windows` overrides only where behavior diverges. NS plugins we depend on have no windows impl — leaf packages need `.windows` `Unsupported` fallbacks, same pattern as `.macos` |
| CLI | `targets.mjs`: `windows` kind (dev = `ns run windows` once cli#6065 lands; interim = `dotnet publish` + exe launch or `NSWinRT.LiveSync` push). `doctor`: `win32` host, .NET 10 SDK, Windows SDK (`makeappx`/`signtool`), WindowsAppSDK framework package, `@nativescript/windows` presence |
| Lint | `isNativeFile` learns `windows`; platform-subpath rules gain `./windows` |
| Packaging | MSIX via `makeappx`/`signtool` (self-signed for dev), or unpackaged exe + WASDK bootstrapper; `app.nsbundle` for source protection. CI: `windows-latest` runners — no cross-compile |
| Runtime supply chain | `@nativescript/windows` is days old → `minimumReleaseAgeExclude` entry, same precedent as the octane packages |

## Open risks

- **Merge risk.** #11272 is 279 files / +183k and a maintainer has already
  asked for it to be split. Until core ships a `windows` platform in a release,
  we prototype on pkg.pr.new previews — unmerged upstream is the schedule risk,
  not a design risk.
- **Desktop semantics.** `Frame`/`Page` and `openWindow` (#59) on a real
  multi-window OS; safe-area/status-bar services mostly reduce to no-ops;
  `KeyboardAvoiding`'s native-only status gets a third interpretation.
- **Verification surface.** The parity sweep (`apps/macos/scripts/parity.mjs`
  pattern) needs a Windows driver-side twin; geometry baselines will differ
  from both web and mobile.

## Sequencing

1. Lab: boot the harness `App` under the WinUI3 template host using
   pkg.pr.new builds — bundled `.mjs` dropped into `app/` needs no CLI
   (Q32). Windows-arm64 VM works — the runtime ships arm64 dlls.
2. Path-agnostic plumbing meanwhile: suffix/condition/lint additions, the
   `xplat.targets.windows` manifest block + doctor checks.
3. `.windows` leaves lazily — only where `.native` diverges; services report
   `unsupported`/`unavailable` like the `.macos` set.
4. Path B spike only if A stalls or to self-host the renderer (Q33).
