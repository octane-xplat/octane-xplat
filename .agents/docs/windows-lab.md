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
`packages/ui/src/components/layout/full-screen-page.mobile.ts` in the Windows bundle.
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

### Page preparation split

Shared routing and the NativeScript integration barrel now import
`full-screen-page` without a platform suffix. iOS/Android retain the existing
`.mobile` implementation. The new `.windows` leaf returns the same Page without
changing its properties, measurement, or content.

The installed `abae298` preview's `ui/page/index.windows.js` creates a WinUI
Grid and appends content to it; its Windows View measures the native host and
leaves child positioning to native panels. There is no mobile safe-area
measurement override in that Page. This supports preserving the Windows host
behavior rather than applying phone-specific properties or the UIKit bounds
workaround. It is implementation evidence, not on-device layout qualification.

Local validation passed: UI tests (983), native Vitest tests (435), their
preceding native Node tests, affected-package/dependent typechecks (53 Turbo
tasks), focused lint, and recipe structure. The Windows regression uses a
frozen page fixture to reject property writes and checks that page identity,
content, and measurement dispatch are preserved. Existing mobile page tests
remain unchanged and pass. No public recipe acceptance criteria changed.

The physical Windows retry passed the page boundary and its standalone
Windows typecheck (37 of 38 Turbo tasks passed). Bundling then rejected
`command-palette-accessibility.mobile.ts`, imported directly by
`CommandPalette.tsrx`. That helper calls iOS or Android announcement APIs;
it needs a platform-resolved Windows accessibility implementation, not a
silent no-op. The delegated checker still reported 15 errors. No app launched.
The host log is `%TEMP%\octane-kitchen-sink-page-split.log`; the remaining
boundary is recorded in local Silo observation
`7987f28d-e4e2-4b3f-b4b6-ba47686fe1f4`.

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

### Native lab app: registration and launch findings

An isolated lab app (menu page plus smoke-nav, input-contract, layout/scroll,
and Intl screens; fixtures under `research/windy-setup/lab-*`) was built to
test the host without the kitchen sink's blocked component barrel. Findings
below are host-setup evidence plus one repository fix; the four driver checks
are ready in `lab-ui.ps1` but produced no runtime results yet.

- **NuGet sources were empty.** `%APPDATA%\NuGet\NuGet.Config` contained an
  empty `<packageSources/>`, so `dotnet restore` failed NU1100 for every
  package. Adding the standard `nuget.org` feed fixed restore (~19 s).
- **Turbo env scrubbing broke MSIX tooling.** `PROCESSOR_ARCHITECTURE` selects
  the `Microsoft.Windows.SDK.BuildTools` arch folder (`x64`/`arm64`/`x86`).
  Filtered out, it defaulted to `x86`, and the recipe task loaded the x86
  `MrmSupport.dll` into the x64 MSBuild process (error 193). Added to
  `build:windows` `passThroughEnv` in `apps/windows/turbo.json`; the lab build
  then completed all 37 tasks and produced `windows.exe`.
- **Per-user AppX registration needs the interactive session.** Package Add /
  Register operations (framework registration, `Add-AppxPackage -Register`,
  and the WinAppRuntime installer) failed `0x80070005` /
  `PackagesInUseClosed` when run from the SSH session-0 virtual token. The
  same commands succeed inside a scheduled task running interactively in
  session 1 (`schtasks /it`). Driver: `research/windy-setup/invoke-interactive.ps1`.
- `Microsoft.WindowsAppRuntime.1.6` 6000.519.329.0 is now registered for the
  desktop user (it had been registered only for a deleted profile SID), and
  `org.nativescript.xplat` is registered
  (`org.nativescript.xplat_8w7k1f04p0kxp`).
- **Launch is still blocked.** Packaged activation is attempted but the
  process dies before a window or `console.log` exists. Before the framework
  was registered, crashes logged `0x80040154` / `0xc000027b` in
  `Microsoft.UI.Xaml.dll` — the same signature recorded for session-0 and
  unpackaged launches on the VM. After framework registration no new crash
  events appear; the process exits silently. The cause is unresolved —
  `apps/windows/App_Resources` manifest, runtime bootstrap, or a remaining
  host-state gap all remain suspects. Local `WindowsAppRuntime.CBS.1.6`
  substitution and loose DLL copies next to the exe did not help; both were
  reverted before the clean registration.

  Follow-up: a **real MSIX install resolves activation** where `-Register` did
  not. `ns build windows --release` produces
  `AppPackages\windows_1.0.0.0_x64_Test\windows_1.0.0.0_x64.msix` (unsigned by
  default; sign with a self-signed `CN=ui` cert in `LocalMachine\TrustedPeople`
  using the SDK buildtools `signtool.exe`). After `Remove-AppxPackage` of the
  loose registration, `Add-AppxPackage -Path` on the signed MSIX launched
  `windows.exe` and JS boot reached `console.log`. The remaining failure is a
  bundle error, not host plumbing: `Uncaught TypeError: Cannot read properties
  of undefined (reading 'setNative')` inside `app\vendor.mjs` — a symbol-keyed
  property descriptor (`[FP.setNative]`) whose imported symbol evaluates to
  `undefined`, consistent with a patched/preview core–bundle export mismatch.
  No window or test output yet; the four checks are still queued behind this.

Next: resolve the launch crash (debugger/WER capture in session 1), then run
`lab-ui.ps1` for the four checks. The kitchen sink remains blocked separately
on the command-palette accessibility mobile import.

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

## 2026-10-24: packaged lab rerun

The physical x64 laptop now runs the Octane lab menu and passes its OS mouse,
Frame navigation, and resize smoke checks. This is runtime evidence for the
isolated lab, not qualification of the kitchen sink or public Windows recipes.
No visual analysis was performed.

### Artifact and packaging

The run used `@nativescript/windows` 0.1.0-alpha.144, MasonKit
1.0.0-beta.126, and the existing release `windows.dll` built at 00:02 on
2026-10-24. The native project contains the experimental CsWinRT 2.3.1
projection setup and generated-interface patcher in `App_Resources/Windows`.
Those source changes remain uncommitted and are not a proven requirement for
native namespace access.

The lab repacker copies the plugin activation extensions into the packaged
manifest and includes `NativeScript.Mason` and `NativeScript.Widgets` DLLs and
WinMDs at the package root. The signed MSIX was installed and launched through
an interactive scheduled task. Temporary scripts and raw results remain under
`research/windy-setup/` on the laptop.

```powershell
& research/windy-setup/repack-lab-msix.ps1
& research/windy-setup/invoke-interactive.ps1 `
  -Script "$PWD/research/windy-setup/run-lab-e2e.ps1" `
  -Out "$PWD/research/windy-setup/lab-e2e.log" -TimeoutSec 600
```

The previous `arrayBufferFromBuffer` failure did not reproduce after repacking
and reinstalling. A logging-only probe observed `Length = Capacity = 612` and
a successful native buffer conversion. The clean bundle passed the smoke check
again after removing that probe. Packaging native metadata is a likely relevant
difference; the individual packaging changes have not been isolated.

The earlier byte-array hypothesis is ruled out by the generated projection:
`Style.Values`, `StyleValues`, and `ForeignStyleValues` return
`Windows.Storage.Streams.IBuffer`. A missing COM-pointer hypothesis is also
insufficient: successful native buffer wrappers exposed neither `__handle` nor
`__native_ptr` to JavaScript in this artifact. Do not add a marshalling shim
based on the old checkpoint alone.

### Harness corrections and evidence boundaries

The input fixture's command channel used `System.IO.File.ReadAllText`, but
`System.IO` was unavailable in the successful native launch. It now reads via
WinRT file APIs. The generated lab bundle was changed directly for this
experiment; a fresh source build of the fixture has not been verified.

```ts
const file = await NSWinRT.toPromise(
  Windows.Storage.StorageFile.GetFileFromPathAsync(commandPath),
)
const text = await NSWinRT.toPromise(Windows.Storage.FileIO.ReadTextAsync(file))
```

The PowerShell acknowledgement predicate also needed expression parentheses:
`Test-Log ([regex]::Escape($sequence))`. Before that correction, the app logged
the blur acknowledgement but the driver timed out. Test failures could leave
the next case on the wrong screen; isolated drivers now start fresh processes.
Final event assertions read JSON event records from the captured log history,
since acknowledgement waits already consume newly read lines. The completed
input run passed 25 assertions and retained one failed caret-position assertion.

The initial combined rerun passed real clicks, forward/back navigation, window
resize, ordinary typing, and Enter submission. Layout mounted and reported
scroll extents, but its window-percent relayout assertion timed out. Its menu
button was offscreen, so the combined run did not reach Intl. These partial
results must not be reported as four passing tests.

### Isolated results

Each case started a fresh app process. The input driver clears only its own
command JSON and temporary command file before launch, preventing a stale blur
command from stealing focus during the next test.

| Case | Runtime result |
| --- | --- |
| Smoke | Passed OS mouse callbacks, detail navigation, back navigation, resize/layout notification, and another click after resizing. |
| Input | Passed ordinary typing/submission, public focus/blur, disabled and secure-readonly focus rejection, plain readonly typing rejection, literal `initial`, `inherit`, `unset`, `revert` values, dynamic accessible names, disabled restoration, secure/plain replacement, readonly safety, and focus after remount. Multiline insertion-position assertion failed with both End and Ctrl+End: observed `first\rZ\rsecond`, rather than appending after `second`. Enter did insert a newline; caret positioning remains unresolved. |
| Layout | Mounted and reported outer/inner scroll extents of 112/580. Window-percent relayout timed out; measured percent host was 300 × 0, parent 300 × 0, child 150 × 19. Page content height was 862 while viewport height was 414.5, leaving the menu offscreen. A follow-up retained the resize failure and found a vertical UIA ScrollPattern, but scroll-target coordinates became `NaN` before wheel input could be sent. OS wheel, nested scroll, and scrolled-content tap remain unverified. |
| Intl | `number-plain`, `currency-usd`, and `currency-de` each logged `Internal error. Icu error.`. The process then exited before the first `date-ja` result or the completion marker. Later date/time-zone cases were not reached. |

Raw isolated results are `lab-ui-result-input.json`,
`lab-ui-result-layout.json`, and `lab-ui-result-intl.json` in the laptop's
research directory. The combined smoke result is in
`lab-ui-result-before-reader-fix.json`. Driver exit status alone is not a pass;
inspect each result's `error` and assertions.

These results do not qualify Windows layout parity, multiline caret
behavior, Intl, or the kitchen sink. The next implementation investigation
should isolate the layout container sizing and the native runtime's ICU/date
formatting failure. Keep the experimental projection/package changes separate
from those investigations until a clean source build reproduces this artifact.
No public workflow or recipe changed in this rerun; no recipe qualification was
advanced. Existing kitchen-sink source edits still need verification.

## Feature-level qualification

Silo's `windows_checks` table owns the ongoing Windows inventory. Its natural
keys distinguish `package:`, `export:`, `ui:`, `demo:`, and `scenario:` records.
These scopes overlap: a demo mount is evidence for that demo's startup, not a
pass for every package or component it imports. Inventory sources are public
package manifests, UI declarations, the maintained demo catalog, and explicit
cross-cutting scenarios. Expand wildcard exports and add missing behavioral
scenarios before claiming complete coverage.

```sh
silo sql "SELECT kind, status, count(*) AS items FROM windows_checks GROUP BY kind, status"
silo row get windows_checks scenario:workflow
silo row get windows_checks demo:counter
```

Each record keeps its required evidence, source revision, execution status,
and evidence payload. Record the actual Windows host, artifact and experimental
overlays, asserted behavior, raw result location, and remaining gaps. Keep
historical artifact evidence distinct from reruns of the current source.
A build, import, successful mount, or synthesized gesture cannot establish
OS input, accessibility, platform service behavior, or layout parity.
Unsupported boundaries need explicit evidence; they are not successful
implementations of the feature.

Use a detached qualification worktree on the laptop to preserve the original
experiments. The current worktree is `dev/octane-windows-qualification`;
`research/windy-setup/qualification-*.ps1` and associated logs live in the
original checkout. Run install normally, then package builds/tests through
Turbo with bounded concurrency. The standalone probe runner still excludes
Windows. Research fixtures remain temporary until promoted into maintained
regression coverage.

```powershell
Set-Location "$env:USERPROFILE/dev/octane-windows-qualification"
pnpm install --frozen-lockfile
pnpm exec turbo run build:windows --filter=@xplat/windows --concurrency=2 -- --release
```

The experimental demo driver records mounted native content, render-boundary
errors and process exits separately for each case. Behavior-specific
interaction, updates, cleanup and accessibility checks remain necessary after
a successful mount. A missing adapter is a harness gap, not a framework failure.
Recipe coverage continues to live in `recipe_audit`; this inventory does not
replace recipe criteria or qualify a public workflow automatically.
