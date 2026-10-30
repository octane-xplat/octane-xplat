# Windows test-host runbook

Internal framework-contributor instructions for testing the repository's
private Windows harness. This is not a downstream app setup guide. Windows is
experimental and UI support remains incomplete; see the
[Windows target notes](../design/windows-notes.md) for current evidence.

## Prepare Windows

Use a licensed Windows 11 x64 machine or VM. Allocate enough memory and disk
space for the workspace, dependencies, and a native build.

Install these Windows tools:

- Node.js 24.x x64 from the [official downloads](https://nodejs.org/en/download).
- The .NET 10 x64 SDK from Microsoft's [.NET 10 downloads](https://dotnet.microsoft.com/en-us/download/dotnet/10.0).
- The x64 Microsoft Visual C++ Redistributable. Use Microsoft's
  [latest supported downloads](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist?view=msvc-170).
- Enable Windows Developer Mode in Settings. NativeScript uses it for its
  development install flow.

Enable pnpm through Corepack using the version pinned in this workspace's
`package.json`:

```powershell
corepack enable
corepack prepare pnpm@11.24.0 --activate
```

Check that Node, pnpm, and .NET are available in the same PowerShell session:

```powershell
node --version
pnpm --version
dotnet --version
```

## Get the workspace onto the VM

Clone the repository on Windows, or copy it from your development machine using
your preferred secure file transfer.

Use the [shared-host scratch convention](host-artifacts.md) for agent uploads,
temporary build clones, packages and logs. On windy, keep them together under
`%USERPROFILE%\agent-scratch\octane-xplat\<task>\`; preserve authoritative source
and retained evidence outside that disposable tree.

From the repository root, the intended checks are:

```powershell
pnpm install
pnpm --filter @xplat/windows exec xplat doctor
$env:NODE_OPTIONS = '--max-old-space-size=4096'
pnpm exec turbo run build:windows typecheck --filter=@xplat/windows --concurrency=1 --continue=dependencies-successful
```

Turbo generates the app before building. The 4 GB Node heap and sequential
tasks let the standalone Windows typecheck complete on the 8 GB test host;
the default heap exhausted memory. The native build is uncached and passes
the Windows program-directory variables needed by NativeScript startup checks.

The workspace pins the matching NativeScript Windows packages. Do not upgrade
`@nativescript/windows`, core, or Vite independently while testing this
experimental target.

## Run an owned desktop helper

When an agent uses Task Scheduler to enter the signed-in desktop session,
set its own helper task to priority **4** before starting it. Task Scheduler's
default **7** gives the process below-normal CPU priority and low I/O and memory
priority; **4** uses the normal interactive profile. See Microsoft's
[priority mapping](https://learn.microsoft.com/en-us/windows/win32/taskschd/taskschedulerschema-priority-settingstype-element).

After the helper registers its unique `$taskName`, configure that task:

```powershell
$ownedTask = Get-ScheduledTask -TaskName $taskName
$ownedTask.Settings.Priority = 4
Set-ScheduledTask -TaskName $taskName -Settings $ownedTask.Settings | Out-Null
Start-ScheduledTask -TaskName $taskName
```

Keep the host's resource reservation for the entire phase. Configure only the
helper's registered task. Allow enough time for installation and compilation,
and verify that owned child processes have stopped before a retry.

## Current status

The Windows-specific NativeScript doctor checks, generated WinUI build, and
registered-package launch have passed. Native component and OS-input checks
have found substantial parity gaps; the full demo harness is not a supported
Windows application yet. Direct launch from a noninteractive SSH session does
not establish desktop rendering; activate the registered app from a signed-in
Windows desktop session.
See [Windows target notes](../design/windows-notes.md) for the current
implementation blockers.

## October 23 preview upgrade

The workspace now pins core and Vite to `abae298` from
[NativeScript#11272](https://github.com/NativeScript/NativeScript/pull/11272).
The preview identifies itself as core `9.1.4-next.0` and Vite `8.0.21`;
registry core `9.1.4-next.0` lacks the Windows files, so preserve the URL pin.
The Windows runtime and CLI pins remain unchanged.

The rebase removes the upstreamed nested tab/frame fixes and Vite vendor
routing/path decoding. Local CSS layers, flex alignment, Windows pointer/input
and percentage-layout lifecycle repairs, re-export handling, and `.mobile`
resolution remain. The gesture rebase preserves upstream transparent-background
hit testing and contact-only pointer movement alongside local event ownership.

Package comparison and patch application are host evidence. Earlier Windows
runtime results do not qualify this preview: rerun build, launch, pointer,
keyboard, and percentage-layout checks on a Windows host before claiming it.

The documented SSH route refused the forwarded connection during the initial
upgrade. A subsequent physical-host attempt installed this preview successfully
and passed the standalone Windows typecheck, but the kitchen sink bundle failed
because `full-screen-page.mobile.ts` was reachable from shared native routing.
The page split cleared that boundary; the next build stopped on the mobile-only
command-palette accessibility helper. Neither attempt launched an app; see the
[physical-host lab record](windows-lab.md#page-preparation-split).

Host checks for this pin pass: installation with the frozen lockfile, patch and
compatibility synchronization, recipe structure, focused compatibility/upgrade
tests, touched-package and dependent typechecks (including Windows), and the
installed-package Windows pointer, input, and percentage-layout regressions. The pointer suite also covers preserved authored backgrounds and
contact-only touch movement from upstream. These exercise JavaScript with host
fixtures, not WinUI hit testing or OS input.

## Mason core package qualification

The Mason fork now maintains the Windows consumer under
`tools/mason-core/consumer/windows`, with preparation, native assertions and an
interactive MSIX runner. Use that fixture to qualify a relocated tarball; the
older lab-only 13-check smoke is insufficient. The source package includes the
CsWinRT projection repair and DotNetBridge content target, so a consumer must
not depend on app-local copies of those repairs.

The pinned `@nativescript/windows@0.1.0-alpha.144` bridge rejects both typed and
ordinary arrays for projected Mason `byte[]` arguments, reporting a
`System.String` to `System.Byte[]` cast. Core's package-owned managed adapter
accepts explicit JSON bytes and calls the unchanged native WinRT API. It also
retrieves `IMasonElement.Style`; the generated projection makes that property
explicit while exposing XAML's unrelated `FrameworkElement.Style` publicly.
These are observed native-consumer limitations, not upstream support.

A NativeScript Label's attached flex setters also call Widgets APIs whose
`UIElement` arguments fail that preview bridge. While Mason owns the child,
core mirrors those values into its own leaf and temporarily owns only the
native `alignSelf`, `flexGrow` and `flexShrink` setters. Detach restores the
original descriptors and Style prototype. Review these workarounds when the
Windows runtime pin changes; remove them only after equivalent native
geometry, buffer, ownership and input checks pass with the replacement.

The current registry betas `.4` and `.5` omit Windows files. A local package
and successful MSIX build do not qualify the default Windows harness or its
managed pin. See the [extraction record](../design/mason-core-extraction.md#windows-core-host-status-2026-10-27)
for the asserted values and remaining cutover gates.
