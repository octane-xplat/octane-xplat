# Windows host lab log

Internal test record. Keep machine-specific setup and raw failure details here;
the public status page is [`docs/platform/windows-setup.md`](../../docs/platform/windows-setup.md),
the contributor runbook is [`windows-test-host.md`](windows-test-host.md), and
design rationale lives in [`.agents/design/windows-notes.md`](../design/windows-notes.md).

## 2026-10-23: physical Windows x64 host

The package toolchain works on a Windows 11 x64 laptop (build 26200, 8 GB RAM,
8 logical processors). This is installation and build evidence; no native app
was launched on this host.

### Setup and portability fixes

The repository was cloned into `C:\Users\<user>\dev\octane-xplat` from release
commit `23d47e31d`, with clone-local `core.longpaths=true` and
`core.autocrlf=false`. Node is 24.13.1 and Git is 2.53.0. The standalone pnpm
installation was repaired and updated to 12.15.0; inside this workspace pnpm
automatically selects the manifest's pinned 11.24.0.

Two POSIX-only path assumptions surfaced during setup:

- The richtext asset builder tested whether the working directory ended in
  `/richtext`. Windows backslashes selected the sibling editors' entry point
  instead. `node:path`'s `basename` now selects the correct entry.
- Route generation split output paths on `/`, producing invalid sibling
  imports such as `./src\routes.gen.types`. Both sibling-name calculations now
  use `basename`. A regression test checks that generated sibling imports
  resolve for default and nested output directories.

These are repository tooling fixes, not upstream runtime workarounds. The
original expectation mismatches are recorded in local Silo observations
`1f2cb1ba-a154-4971-bc28-f7660956eadb` and
`ae5a9d81-fcd4-41c1-9358-aa326f15135d`.

### Verification and next native tests

The normal frozen install completed, including dependency hooks and workspace
generation. The package build completed all 61 tasks; app generation completed
all 35 tasks and reproduced the tracked route files without differences. Run
these from the repository root:

```powershell
pnpm install --frozen-lockfile
pnpm exec turbo run typegen build build:assets '--filter=./packages/*' --concurrency=2
pnpm exec turbo run gen --filter=@xplat/app --concurrency=2
```

On macOS, the CLI's 351 tests passed, including the new import-resolution case.
Typechecks passed for the CLI, richtext, and their dependents. Focused lint and
`pnpm check:recipes` passed. No public API, recipe acceptance criteria, or
supported-platform claim changed; Windows runtime coverage remains separate.

The initial Windows host doctor found no .NET SDK and Developer Mode unset.
Both prerequisites were then configured: Microsoft's signed
[.NET SDK 10.0.402 x64 installer](https://dotnet.microsoft.com/en-us/download/dotnet/thank-you/sdk-10.0.402-windows-x64-installer)
completed with exit 0 and no restart required, and
`AllowDevelopmentWithoutDevLicense` was set to DWORD `1` using the
[documented Developer Mode setting](https://learn.microsoft.com/en-us/windows/advanced-settings/developer-mode#use-powershell-to-enable-your-device).
A fresh SSH session resolves `dotnet --version` to `10.0.402`, and Xplat's
Windows SDK and Developer Mode checks pass. After SSH access resumed, the
supplemental `pnpm --filter @xplat/windows exec ns doctor windows` log and exit
file confirmed exit 0 and "No issues were detected." Its version-update notices
do not change the workspace's pinned NativeScript dependencies.

The broader Xplat doctor still exits 1 with harness compatibility/HMR findings
and the existing false `pnpm — missing` result despite successful pnpm commands.
Follow the [host runbook](windows-test-host.md) for native validation; successful
prerequisite checks and package builds do not establish native app behavior.

Recommended first tests, in order:

1. Build and launch a minimal app in the interactive Windows session. Require
   a responsive window, successful public-root mount, and a real button click
   with its callback. This establishes the host and event path.
2. Run the retained [input contract case](windows-input-contracts-repair.md):
   real typing, focus/isolated blur, submit, multiline input, disabled/readonly
   states, accessible names, secure replacements, and remount cleanup. These
   repairs have unit evidence but await OS keyboard and UIA validation. Adapt
   the old VM-specific runner paths/session setup for this host first.
3. Run an isolated [Intl smoke test](windows-intl-repair.md) before the broad
   component sweep. The pinned runtime has a known formatting failure; the
   repaired DLL was qualified on the older VM but is not in the pinned release.

### Kitchen sink attempt with preview abae298

After merging `origin/main` at `f80c49c3`, frozen installation passed with the
new URL pins: core `9.1.4-next.0` and Vite `8.0.21` from `abae298`. The Windows
runtime remains `0.1.0-alpha.144`. Installation included the workspace hooks
and generation.

The private harness needed a registered Turbo `build:windows` task. Its
NativeScript startup also requires `CommonProgramFiles(x86)` on x64 Windows:
`@nativescript/doctor@2.0.18` reads it in `SysInfo.isITunesInstalled` before
joining an Apple directory path. Turbo's filtered environment omitted it,
causing an undefined-path error. The task now passes the Windows program
paths and `LOCALAPPDATA` used by those startup checks, plus `NODE_OPTIONS`.
No dependency source was patched for this integration fix.

The standalone Windows typecheck exhausted its default roughly 2 GB heap.
With `NODE_OPTIONS=--max-old-space-size=4096` and sequential tasks, it passed.
The combined build/typecheck run completed 37 of 38 tasks; only the native
build failed. Follow the commands in the [host runbook](windows-test-host.md).

The build reached Vite bundling, then the platform-boundary plugin rejected
`packages/ui/src/full-screen-page.mobile.ts` in the Windows bundle.
`native-router-host.ts` imports that leaf directly, and `nativescript/index.ts`
re-exports it. There is no `full-screen-page.windows.ts`. The guard remains
intact: resolving the shared page setup versus mobile safe-area behavior is
required before this kitchen sink can build.

Vite's delegated checker also reported 15 errors across 12 files, including
platform-relative bridge/focus imports, missing `keyboard-overlay-host`, and
mobile NativeScript API/type mismatches. These remain unresolved even though
the standalone Windows check passed. The full retry log is retained on the
host at `%TEMP%\octane-kitchen-sink-preview-retry.log`.

No native app was produced or launched by this attempt. There is no new
rendering, OS-input, or public recipe evidence. The runner changes concern
only the private harness and do not change public support claims. The build
boundary failure is recorded in local Silo observation
`552873e8-729a-4469-8abe-e1fb17e501d1`.

### Prevent idle sleep during a development session

PowerToys Awake is already installed on this host. Start it from the Windows
PowerShell session that owns the work:

```powershell
Start-Process "$env:LOCALAPPDATA\PowerToys\PowerToys.Awake.exe" `
  -ArgumentList "--pid $PID --display-on=false"
```

Awake exits when that PowerShell process exits and lets the display turn off.
It does not change the power plan or override deliberate sleep; keep the lid
open during remote work. See [Microsoft's Awake CLI reference](https://learn.microsoft.com/en-us/windows/powertoys/awake#command-line-interface-cli).

## 2026-10-01: VM baseline

The following records the earlier VM run. Its install/build failures are
historical and do not describe the physical host's package build above.

### Host

- Run date: 2026-10-01.
- UTM 4.7.5 on an Intel Mac running macOS 15.7.7.
- Windows 11 Pro x64 VM, build 26200; 8 GB RAM, 4 virtual CPUs, 64 GB disk,
  TPM 2.0, and Secure Boot. Installed from a standard Windows 11 Pro x64 ISO.
- The guest used UTM shared/NAT networking. Its `10.0.2.x` address was not
  directly reachable from the development Mac; SSH worked through the Mac
  host's port forward and SSH jump. No usernames, hostnames, keys, or
  credentials belong in this log.

### Installed toolchain

- Node.js 24.19.0 x64 at `C:\Users\<user>\tools\node-v24.19.0-win-x64`.
- .NET SDK 10.0.401 at `C:\Users\<user>\tools\dotnet`; `DOTNET_ROOT` and
  `PATH` were set for the guest user.
- pnpm 11.24.0 via Corepack (`corepack enable` and
  `corepack prepare pnpm@11.24.0 --activate`).
- `@nativescript/windows` 0.1.0-alpha.144, selected by the workspace.
- Developer Mode enabled through the `AllowDevelopmentWithoutDevLicense`
  registry setting.
- The x64 Microsoft Visual C++ Redistributable was required on this clean VM:
  `workerd.exe` and `platforms/windows/tools/dotnet-tool.exe` initially exited
  with `0xc0000135`. After downloading Microsoft's official
  `https://aka.ms/vc14/vc_redist.x64.exe`, its signature was verified and it
  was installed with:

  ```powershell
  C:\OctaneSetup\vc_redist.x64.exe /install /quiet /norestart /log C:\OctaneSetup\vc-redist.log
  ```

  The registry then reported the x64 runtime installed (version
  `v14.51.36247.00`).

### Workspace and checks

The workspace was copied to `C:\Users\<user>\dev\octane-xplat`.

- `ns doctor windows` exited 0 with “No issues were detected.”
- `pnpm --filter @xplat/windows exec xplat doctor` passed the Windows host,
  NativeScript Windows package, .NET SDK, Developer Mode, and Node checks. The
  broader doctor also emitted non-Windows findings, including a false
  `pnpm — missing` result.
- `pnpm --filter @xplat/app gen` succeeded and generated route artifacts for
  Windows.
- `pnpm install` installed dependencies but exited non-zero during
  `@octane-xplat/auth` postinstall: tsrx-typegen reported that `src/index.ts`
  was outside its TypeScript project. A subsequent
  `pnpm install --ignore-scripts` exited 0 but skipped generators and is not a
  successful clean install.
- `pnpm run build:windows` (from `apps/windows`) reported 52 TypeScript errors,
  then Vite/xplat boundary validation failed because
  `packages/ui/src/native/index.ts` resolved to
  `packages/ui/src/root-layout.mobile.ts` in the Windows bundle. No app bundle
  launched.
- The generated native project built independently with:

  ```powershell
  dotnet build apps\windows\platforms\windows\windows\windows.csproj --verbosity minimal
  ```

  Result: 0 errors, 9 nullable/platform analyzer warnings. This validates the
  WinUI project compilation only; it does not validate app boot or rendering.

### Remaining work at the time

Fix the auth type-generation project boundary and Windows bundle's native-entry
resolution, then rerun the normal install and Windows build before attempting
`ns run windows`. App boot, rendering, the demo sweep, and per-seam `.windows`
divergence checks remain unverified.
