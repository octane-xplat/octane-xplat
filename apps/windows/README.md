# Windows experiment (WinUI 3 via `@nativescript/windows`)

Path A of the windows investigation ([.agents/design/windows-notes.md](../../.agents/design/windows-notes.md),
decision #65): this scaffold is intended to run the shared harness on upstream's in-flight
`@nativescript/core` windows platform ([NativeScript#11272](https://github.com/NativeScript/NativeScript/pull/11272)
preview builds) inside the `@nativescript/windows` WinUI 3 host. No custom
renderer — `@nativescript-community/octane` drives core views as on
iOS/Android, and `.windows.*` leaves sit ahead of the unsuffixed native default in
the suffix chain.

## Status

The harness remains experimental. Earlier Windows build and input evidence is
recorded in the [test-host runbook](../../.agents/docs/windows-test-host.md).
A bounded x64 packaged run on this preview passed 13 input, modal and scrolling
scenario groups; see the [target evidence](../../.agents/docs/parity/windows-support-progress.md#qualified-bounded-common-flow-batch-v6).
That run used core patch f6bf77c5. The later synchronous-filesystem patch is
source-contract checked only and still needs native adoption/verification.
The full shared harness, other architectures and wider support gates remain
unqualified.

Pins, all deliberate:

- `@nativescript/core` / `@nativescript/vite` come from
  `pkg.pr.new/...@abae298` (the October 23 revision of PR #11272,
  including the percentage-size hook from PR #11468). Use the commit pin: the PR-number
  URL moves when upstream pushes, invalidating the lockfile checksums.
- `@nativescript/windows` is exact `0.1.0-alpha.144` — ranges match
  incompatible older prereleases.
- `nativescript` CLI is the dev tag `9.1.2-dev.2026-09-24-*`, which already
  carries the windows platform (`ns run windows`, `ns doctor windows`);
  released CLI waits on `nativescript-cli#6065`.
- The workspace carries preview-specific patches for `core@9.1.4-next.0`
  and `vite@8.0.21`; the commit pin preserves the versions they target.
  Registry core with the same version has no Windows implementation.
  The patches retain Windows input/pointer/layout repairs and CSS layers;
  upstream now supplies the nested tab/frame and vendor-routing/path-decoding fixes.
- The app dedupes `@nativescript/core` to the PR build in vite config and
  tsconfig `paths`; workspace packages' devDeps would otherwise resolve
  the mobile core version from inside `packages/*`.

## Standalone WebView2 bridge host

`webview-host/` is a separate WinForms/WebView2 experiment for `.web` desktop
frontends. It does not replace the NativeScript/WinUI scaffold below. The host
speaks the shared typed bridge protocol (`__xplatHostTransport` plus the
`__xplatBridge` compatibility surface), injects bootstrap state, and implements
the core desktop services: app metadata/state/window size, clipboard, file
pickers and file access, notifications, `PasswordVault` secure storage,
appearance, storage, URL/path opening, clipboard-copy sharing, secondary
windows, and named-pipe forwarding for second-instance deep links.

On Windows with the .NET 10 SDK and the WebView2 Runtime:

```powershell
cd apps/windows/webview-host
dotnet run -- --url http://localhost:5200
dotnet run -- --bundle <frontend-dist>
dotnet run -- --bundle <frontend-dist> --self-test
```

A URI argument becomes the cold-start `initialUrl`; later invocations forward
through the named pipe as `app.deep-link`. `--self-test` runs
`bridge-selftest.linux.js` from `packages/cli/src/linux/host` because the
protocol contract is intentionally shared across hosts. This source has been
compile-checked against Windows reference assemblies on macOS, but it has not
been launched on Windows yet; treat WebView2 runtime behavior as unverified.

## Running

Requires Windows 10 1809+ (the runtime ships arm64 DLLs; this harness has not
been verified in an arm64 VM),
.NET 10 SDK, Developer Mode enabled, and Node + pnpm. Then:

```sh
pnpm install          # in the repo root
pnpm gen:app
pnpm -C apps/windows xplat dev windows
# or: pnpm -C apps/windows windows
```

`pnpm -C apps/windows xplat doctor` checks the win32 host, exact
`@nativescript/windows` pin, .NET SDK ≥ 10, and the Developer Mode registry flag.

Build from the repository root through Turbo. Its existing app-generation
dependency runs in the same graph, so the sequential limit also covers
generation; the Windows build script starts NativeScript directly.

```sh
pnpm exec turbo run build:windows --filter=@xplat/windows --concurrency=1 -- --release
```


## Filesystem source contracts

After adopting the workspace patch set, run the Windows filesystem regressions
against the installed core package from the repository root:

```sh
pnpm exec turbo run test:filesystem --filter=@xplat/windows
```

These Node/VM tests fake the native file backend. They do not open OS files or
prove actual Windows I/O. For an isolated candidate, set WINDOWS_CORE_ARTIFACT
to the folder containing file-system/file-system-access.windows.js:

```powershell
$env:WINDOWS_CORE_ARTIFACT = 'C:\path\to\candidate-core'
pnpm exec turbo run test:filesystem --filter=@xplat/windows
```
