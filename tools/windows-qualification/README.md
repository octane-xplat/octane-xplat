# Windows layout qualification driver

This private driver collects UI Automation (UIA) and numeric host-frame evidence
for the seven layout/text components and the maintained fixed-width shrink
regression in the Windows core-component plan.
[Qualification host constraints](../../.agents/docs/parity/windows-support-progress.md#qualification-host-constraints)
explain root sizing, measurement, and evidence boundaries. Current runtime
qualification lives in Silo; a diagnostic result is not component qualification.

## Prepare the package

Reuse the host's existing source checkout after inspecting its local changes
and reserving the host. A retry of the same build uses the installed package;
it does not need a new clone or native build. Keep per-run scripts and results
under the disposable scratch path shown below.

Build the dedicated host from the repository root on Windows:

```powershell
$env:XPLAT_WINDOWS_QUALIFICATION = '1'
$sourceCommit = (git rev-parse HEAD).Trim()
pnpm exec turbo run build:windows --filter=@xplat/windows --concurrency=1
```

This selects `apps/windows/src/qualification/index.ts` and package identity
`org.octanexplat.windows61`. The bundle embeds its Git commit and whether the
source worktree was dirty when Vite loaded the configuration. NativeScript's
application-directory output must then be packaged, signed and installed as an
MSIX. Keep the package version and build source commit with that artifact.

The fixture root requests `100%` width so child percentages have a definite
containing width. `flexGrow` alone does not establish that width under a
NativeScript Page, which is not a Mason flex parent. Use the same root setup
when adding responsive fixtures:

```tsrx
import { Text, VStack } from '@octane-xplat/ui'

export function ProbeRoot() @{
  <VStack width="100%">
    <Text>Root width follows the native page.</Text>
  </VStack>
}
```

## Collect evidence

Reserve `device:windy` and `desktop_input:1` through Goddard before agent-driven
Windows work. Run the driver in the signed-in Windows desktop session, using
the exact commit and version of the installed qualification package. Choose a
new output directory so earlier evidence is preserved.

For example, after installing a qualification MSIX version `1.0.0.76` built
from `$sourceCommit`, choose a new run below the task's disposable scratch
folder:

```powershell
$taskRoot = Join-Path $env:USERPROFILE 'agent-scratch/octane-xplat/windows-core20-1640312b'
$runRoot = Join-Path $taskRoot '20261030-layouts-76'
New-Item -ItemType Directory -Force -Path "$runRoot\tmp" | Out-Null
$env:TEMP = "$runRoot\tmp"
$env:TMP = $env:TEMP
.\tools\windows-qualification\layouts.ps1 `
  -ExpectedCommit $sourceCommit `
  -ExpectedPackageVersion 1.0.0.76 `
  -OutputDirectory "$runRoot\evidence"
```

Use the [shared-host artifact convention](../../.agents/docs/host-artifacts.md)
for scripts, packages and logs. Copy results worth retaining outside scratch
before citing them; the entire scratch task folder remains disposable.

A source worktree with uncommitted changes requires `-AllowDirtyProbe`. That
switch records a diagnostic run; the plan's final qualification still requires
a fresh install and packaged build of clean `main`.

The driver selects one fixture at a time, changes its props, unmounts/remounts
it and resizes its window. It checks names, types, bounds, spacing and relevant
text patterns. A half-width fixture viewport and DPI-scaled window sizes force
the narrow run below the components' width caps. Resize checks include wrapped
stack rows, padding and centering. The shrink case mounts the same fixture used by web parity and
checks its six geometry assertions before and after remounting. Layout-frame checks use the native readout alongside UIA child
bounds; a named UIA group's content rectangle is not assumed to be its layout
frame. The driver restores the window position and stops its owned app.

UIA reads run in a separate MTA process, following Microsoft's
[threading guidance](https://learn.microsoft.com/en-us/windows/win32/winauto/uiauto-threading).
Each read verifies that the window belongs to the expected app process and has
a 30-second deadline. A timeout records the last API reached and fails the
case; the caller can still stop its app and retain the failure evidence.

## Read the output

`result.json` identifies the embedded app source, driver and reader file hashes,
MSIX version, launch ID, loaded Mason DLL hash, each assertion and any failure. Per-stage `*-uia.json` and
`*-native.json` files preserve the measurements; `console.log` preserves the
app events.

UIA `x` and `y` are physical screen pixels. UIA `width` and `height`, and all
native frames, are device-independent pixels (DIP). The window DPI scale is
recorded in the preflight checks.

Exit 0 means the driver's current assertions passed. `qualification` remains
`pending-completion-audit`: review the plan's full acceptance criteria before
updating a component row in Silo. This driver currently covers layout/text;
actions, display, collections and navigation require their own OS-input checks.
