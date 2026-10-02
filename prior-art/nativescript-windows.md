# NativeScript/windows (the Windows runtime)

> Upstream record for the Windows target — everything here is desk-source
> (repo + published package read), nothing lab-verified yet. Repo:
> <https://github.com/NativeScript/windows>. Read alongside
> `docs/notes/windows-notes.md`, which is our plan.

Three consumption modes ship from one workspace.

## `@nativescript/windows` — the app runtime (published)

`0.1.0-beta.4` hit npm 2026-09-27 ("NativeScript Windows runtime with a WinUI 3
app template"). The package is a framework dir, mirroring `@nativescript/ios`
/`android` (`nativescript: { runtime: "windows", engine: "v8" }`):

- `framework/__PROJECT_NAME__/` — a WinUI 3 / Windows App SDK 1.6 C# host
  (`net10.0-windows10.0.26100.0`, min OS 10.0.17763, x64 + arm64). MSIX
  manifest: `Windows.FullTrustApplication` + `runFullTrust`, package dependency
  on `Microsoft.WindowsAppRuntime.1.6`.
- `RuntimeHost.cs` P/Invokes `nativescript.dll`'s C ABI: `runtime_init(appRoot)`,
  `runtime_runscript`, `runtime_pump_timers`, `runtime_notify_app_event`,
  `runtime_devtools_start` (CDP inspector URL on :42000; Debug builds load the
  `libs/devtools/` DLL variant), `runtime_read_protected_file` /
  `runtime_set_bundle_key` (sealed `app.nsbundle` source protection via the
  bundled `nsbundle_pack` tool).
- JS entry: `app/package.json` `{ "main": "main" }`; `.mjs` entries load as
  real ES modules, classic scripts get a `runtime.js`/`vendor.js` prelude
  (webpack legacy).
- JS runs on the XAML UI thread; the host pumps JS timers once per frame off
  `CompositionTarget.Rendering` plus a 100 ms `DispatcherQueueTimer` heartbeat,
  enqueued outside the render walk to dodge XAML's re-entrancy guard.
- JS surface: `Windows`/`Microsoft`/`NativeScript` root namespace proxies,
  natural member syntax, `new …RoutedEventHandler(fn)` delegates,
  `NSWinRT.wait(op)` sync-over-async, `NSWinRT.asDelegate`/`createEventEmitter`,
  WinRT subclassing (`class extends WinRTClass`, composition ABI wired), keyed
  `IMap` sugar, and a bundled C# `dotnet-bridge` that CLR-reflects members
  WinRT metadata can't see (e.g. `App.MainWindow` on a managed
  `Microsoft.UI.Xaml.Application` subclass — `runtime/src/ns_proxy.rs`).
- WinMD discovery: system `Windows.*` resolves via `RoGetMetaDataFile`;
  third-party/app winmds are sideloaded — auto-scan of exe dir + app root, plus
  `interop.registerWinmd`/`scanWinmdDir`. The template already deploys
  `Microsoft.Web.WebView2.Core.winmd` for WebView.
- Tools shipped: `ManifestMerger`, `typings-generator`,
  `dotnet-typings-gen`, `sbg` (static binding generator — JS→C# proxies for
  subclassing managed/WinRT types), `nsbundle_pack`.

Engine variants `@nativescript/windows-{quickjs,hermes,v8,jsc}` are the same
framework + ABI over napi-backed engines — drop-in dependency swap, per
`packages/README.md`. (`windows-v8` is rusty_v8 via a ported napi shim; hermes
is the prebuilt Microsoft.JavaScript.Hermes NuGet; jsc is Playwright's
webkit-win64 build.)

## `@nativescript/windows-napi` — the Node-API addon (not published)

`windows-napi/` is a napi-rs `.node` (`windows.<triple>.node`, x64 + arm64
msvc) + `nswinrt.js` — WinRT interop inside Node/Bun/Deno. Structurally the
same shape as our `@nativescript/macos-node-api` spike. Publish is
tag-triggered (`windows-napi-v*` CI); **absent from npm as of 2026-09-28** —
using it means building from source (Rust + MSVC + @napi-rs/cli).

Constraints from `windows-napi/docs/napi-consumption.md`:

- `Windows.UI.Xaml` activation fails headless (`RPC_E_WRONG_THREAD` — needs a
  XAML-initialized thread); `Windows.UI.Composition` works because the backend
  creates a `DispatcherQueue` for the JS thread.
- The addon adds `native.createWindow(title,w,h)` (Win32 HWND),
  `native.attachCompositorToWindow`, `native.pumpMessages`,
  `native.pollWindowEvents`, `native.setWindowTitle` — the demo drives a real
  interactive Composition visual tree from plain `node`.
- Whether `Microsoft.UI.Xaml` (WinUI 3) can be brought up from a bare Node
  process — WASDK bootstrap + `DispatcherQueueController` +
  `Application.Start` — is untested upstream.

## Dev infrastructure inside the runtime

`runtime/src/esm_http.rs` reimplements the iOS HTTP-ESM loader contract
verbatim (`/ns/m` fetch semantics, import maps, canonicalization vocabulary)
— "mechanism mirrors ios/NativeScript/runtime/HttpLoader.mm".
`hmr_support.rs` + `livesync.rs` install `NSWinRT.HMR` / `NSWinRT.LiveSync`
(`sync(sourcePath, destPath)`, `reload`, `reset`) — module-cache invalidation

- re-eval driven by host tooling, so a dev loop exists even without `ns run`
  CLI support. `inspector.rs` + the `devtools` DLL variant give CDP debugging.

## The core platform PR (the part that matters most)

`NativeScript/NativeScript#11272` "feat: windows" (open; 279 files, +183k;
closes #254) adds a full `windows` platform to `@nativescript/core`:

- `index.windows.ts` for essentially the whole widget surface — view base,
  Frame/Page, all layouts, ListView, ScrollView, TextField/TextView, Switch,
  Slider, TabView, SplitView, WebView, HtmlView, dialogs, gestures,
  transitions, application, file-system, connectivity, http, image-source,
  platform/device/screen, timer.
- Targets **`Microsoft.UI.Xaml` (WinUI 3)**, `Microsoft.UI.Composition` for
  shadows, backed by prebuilt `NativeScript.Widgets.{dll,winmd}` C++/WinRT
  components (`packages/core/platforms/windows/{x64,arm64}`; sources in
  `packages/ui-mobile-base/windows/widgets-cpp` — custom FlexboxLayout/
  StackLayout panels, Clip/Scroll/Shadow/TextShadow/Font/Tile helpers).
- `plugin.props`/`plugin.targets` so plugins ship `platforms/windows` content.
- `@nativescript/vite` gains `windows` through the HMR server path
  (deps-bundle, server-origin, websocket bridges, vendor manifest);
  `@nativescript/webpack5` gets `platforms/windows.ts` + an
  `App_Resources/Windows` scaffold (manifest, assets, `app.csproj`).
- `packages/types-minimal` ships `windows.d.ts` (~151k lines) +
  `microsoft.ui.d.ts` typings.
- Preview installs exist: `npm i https://pkg.pr.new/@nativescript/core@11272`
  and `/@nativescript/vite@11272`.

Companion PR `NativeScript/nativescript-cli#6065` "feat: windows" is open;
published `nativescript@9.1.1` contains no `windows` references — but the
windows support ships in the dev-tag CLI (`nativescript@9.1.2-dev.*`), and
`ns run windows` works there today.

## Dogfooded starter — `triniwiz/nativescript-desktop-starter-template`

The runtime author's own starter (created 2026-09-27) is a nativescript-vue app
running `ns run windows` / `ns run ios` / `ns run android` off `src/app.ts`.
Facts worth copying:

- Pins: `pkg.pr.new/@nativescript/core@11468` + `/@nativescript/vite@11468`
  (the feat/windows branch **plus** a percentage-size fix — prefer this over
  the raw #11272 build), `@nativescript/windows` **exact** alpha (caret matches
  incompatible older betas), npm `overrides` to force the PR core through
  transitive deps, dev-tag `nativescript@9.1.2-dev.2026-09-24-*` CLI.
- Prereqs: Windows 10 1809+, Node LTS, .NET 10 SDK (`dotnet build`), Developer
  Mode for unsigned debug install. No Rust/MSVC on the app side.
- `ns run windows` builds, installs, launches, and livesyncs on save;
  `ns doctor windows` exists in the dev CLI.
- `nativescript-vue@3.1.2` + `@nativescript/vite`'s vue preset proves the
  universal-driver-over-core layering works on this runtime; the ws transport
  is `@valor/nativescript-websockets` (same one our harness uses).
- It carries a `masonkit-hmr.mjs` `/ns/m` middleware that canonicalizes
  specifier URLs because the device double-loads modules when `import` vs
  `export from` resolve differently — the same dev-server bug family we patch
  in `@nativescript/vite`.
- CSS seams: unitless = dp, `px` = physical pixels; Tailwind 4 via
  `@nativescript/tailwind` with postcss workarounds for selector commas
  (NativeScript#11463) and stripped layout utilities.

Namespace note: repo demos/tests use `Windows.UI.Xaml.*` (legacy UWP surface,
or system XAML via islands — `runtime/src/ui_dispatcher.rs` mentions
`WindowsXamlManager`); core's windows code and the app template use
`Microsoft.UI.Xaml.*`. No alias was found in the metadata resolver — treat
`Windows.UI.Xaml` demo code as legacy until lab-verified. See Q34.
