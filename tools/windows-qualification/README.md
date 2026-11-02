# Windows component qualification drivers

These private drivers collect UI Automation (UIA) and numeric host-frame evidence
for the seven layout/text components and the maintained fixed-width shrink
regression, plus native Button, Pressable and Link input in the Windows
core-component plan.
The action driver also has opt-in Card/Banner, ListItem and panel-tab modes.
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
bun run turbo run build:windows --filter=@xplat/windows --concurrency=1
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
case. Cleanup waits at most five more seconds after terminating the client,
so the enclosing driver can stop its owned app and retain the failure evidence.

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
updating a component row in Silo. Display, collections and menus require
their own OS-input checks; panel-tab input uses the opt-in mode below.

## Run action checks

Use the same installed qualification package and reservation as above. Run
`actions.ps1` in a fresh PowerShell process inside the signed-in desktop
session, using a new output directory:

```powershell
powershell.exe -NoProfile -NonInteractive -File .\tools\windows-qualification\actions.ps1 `
  -ExpectedCommit $sourceCommit `
  -ExpectedPackageVersion 1.0.0.81 `
  -OutputDirectory "$runRoot\actions"
```

The driver first checks all three controls together: Button/Hyperlink roles,
names, Invoke, peer/drawing frames, the 8-DIP sibling gap and physical Tab
navigation. It then isolates each control for Enter/Space, mouse and Invoke,
prop changes, remount and resize. Button and Pressable also reject disabled
focus, keys, Tab, mouse and Invoke, and update their implicit names from text.
Link's disabled check is not applicable because its public props have no
disabled flag. Its injected router component must receive the exact `href`
once and publish the destination after each input method.

`action-uia.ps1` performs focus, Invoke and SelectionItem.Select operations in a
bounded MTA process. Selection requests can target genuine TabItem/ListItem
peers; ComboBox focus is also supported. Replace
the example handle and process ID with the owned app's current values:

```json
{
  "windowHandle": 123456,
  "expectedProcessId": 4321,
  "operation": "select",
  "controlType": "ControlType.TabItem",
  "name": "Third 0"
}
```

For peers that support SelectionItem, `capture-uia.ps1` adds selection state and
the selection container's name to the ordinary bounds/pattern capture:

```json
{ "selected": true, "selectionContainerName": "Stock WinUI tabs" }
```

Popup queries can return the same UIA element more than once. Both helpers
deduplicate nonempty runtime IDs within each query, retaining distinct controls
that share a name. Captures include `runtimeId` and `className`; reader metadata
keeps raw `elementCount`, unique `rowsCaptured` and `duplicateElementsSkipped`.
Action results retain raw and unique matching/focused counts. Treat
[runtime IDs](https://learn.microsoft.com/en-us/dotnet/api/system.windows.automation.automationelement.getruntimeid?view=windowsdesktop-10.0)
as opaque comparison values; do not persist them as identities across captures.

```json
{ "elementCount": 6, "rowsCaptured": 3, "duplicateElementsSkipped": 3 }
```

These helper capabilities do not establish public TabList/Tab qualification.
Both helpers verify the owned window/process. Keyboard and mouse use Win32
input only while that window is foreground. Input is never dispatched through
fixture commands. Cleanup restores the pointer and window position and stops
the owned app. Retain the per-operation `uia-actions/` output as well as UIA
captures, native frames, app events and `result.json`.

Keep exact run counts, package identities and remaining qualification gates
in Silo. When monitoring live files, use
[read/write sharing](../../.agents/docs/windows-test-host.md#read-live-diagnostic-files-without-locking-their-writers)
so observation does not block the writer.

## Run panel-tab checks

Select `-TabActions` to exercise the public `TabList`/`Tab` scene. Use one action
mode per run and a new output folder:

```powershell
powershell.exe -NoProfile -NonInteractive -File .\tools\windows-qualification\actions.ps1 `
  -ExpectedCommit $sourceCommit `
  -ExpectedPackageVersion 1.0.0.107 `
  -OutputDirectory "$runRoot\tabs" `
  -TabActions
```

The mode checks genuine TabItem/SelectionItem peers, one forward/backward Tab
stop, mouse and arrow/Home/End selection, matching panel content, disabled
rejection, updated names/current callbacks, controlled rejection and remount.
It retains failed requests as well as passing captures. Structural
insertion/reordering, rich-slot geometry and overflow resizing need separate
checks. Passing this mode alone does not qualify the final fresh-install
core-component run.

Controller and compiled-leaf regressions run without a Windows desktop:

```sh
bun run turbo run test:windows --filter=@octane-xplat/ui
```

Those tests do not establish OS input, layout or UIA behavior.

## Run Card and Banner action checks

Use a fresh package built from the maintained display fixture and a new output
directory, in the same signed-in desktop session and device/input reservation:

```powershell
powershell.exe -NoProfile -NonInteractive -File .\tools\windows-qualification\actions.ps1 `
  -ExpectedCommit $sourceCommit `
  -ExpectedPackageVersion $packageVersion `
  -OutputDirectory "$runRoot\display-actions" `
  -DisplayActions
```

This mode checks ClickableCard, Banner's end action and Banner dismissal. The
fixture places a focus anchor before and after each display case so physical
Tab and Shift+Tab must enter and leave the controls in order. Disabled Card and
end-action peers must be skipped. Banner dismissal has no public disabled prop;
the output records that applicability boundary.

To repeat one control, add `-DisplayActionCase clickable-card`, `banner-action`
or `banner-dismiss`. The default `all` runs all three, and the report records
the selected case. For example, a focused dismissal run keeps every dismissal
assertion:

```powershell
powershell.exe -NoProfile -NonInteractive -File .\tools\windows-qualification\actions.ps1 `
  -ExpectedCommit $sourceCommit -ExpectedPackageVersion $packageVersion `
  -OutputDirectory "$runRoot\banner-dismiss" -DisplayActions -DisplayActionCase banner-dismiss
```

The driver writes completed cases to `case-progress.json` after each case. Its
status stays `partial`; use the final `result.json` and process exit status for
the full invocation. This preserves finished assertions if a later case or
external watchdog stops the run. After launch, event parsing selects that boot
before decoding JSON, so earlier launches' layout snapshots do not slow each
command check.

Enter, Space, mouse and Invoke must each call the correct callback exactly once.
Dismissal must also remove the Banner and its native action peer. Prop updates
must replace the name, and an activation event must carry the current fixture
revision. Remount, applicable disabled rejection, native-peer frame alignment
and resized frames are checked separately. Commands select props and mounts;
they never dispatch an action callback.

This mode does not replace display content, slot-order, wrapping, image or
narrow-layout checks. Exit0 still leaves the plan's completion audit pending.
Keep an action pass separate from any unresolved geometry failure.

## Inspect the collections source fixture

A package containing the maintained `collections` scene exposes named List
and ListItem examples, leading/trailing slots, primitive-zero content, a row
action, and focus anchors. Select it through the package's recorded command
channel with a fresh sequence, for example:

```json
{ "sequence": "collections-inspection-1", "action": "scene", "value": "collections" }
```

Use the existing `revision`, `disabled` and `mounted` commands to change props.
Only real OS/UIA input may activate `Open row`; its callback records source
`list-item` and the current fixture revision. This fixture is prepared source,
with a separate row-input driver mode. Run it against the recorded package
commit and version, in the signed-in session under the device/input reservation:

```powershell
powershell.exe -NoProfile -NonInteractive -File .\tools\windows-qualification\actions.ps1 `
  -ExpectedCommit $sourceCommit `
  -ExpectedPackageVersion $packageVersion `
  -OutputDirectory "$runRoot\list-item-input" `
  -ListItemActions
```

This mode checks Tab/Shift+Tab order, Enter/Space/mouse/Invoke exactly once,
current callbacks, disabled rejection, prop updates, removal/remount and the
input peer's frame at wide and narrow sizes. Choose one action mode per run;
`-ListItemActions` and `-DisplayActions` cannot be combined. Execution results
belong in Silo and the retained run files.

This is a bounded input prerequisite. Inspect native List/ListItem structure and
retain the full final gates before claiming support; a row Button peer alone
does not establish those roles or geometry.

## Inspect Table and tab source fixtures

The maintained `table` and `tabs` scenes render the public components and their
actual plugin/selection paths. They are prepared source, with no completed OS
drivers or qualification result. Select either through the recorded command
channel:

```json
{ "sequence": "table-inspection-1", "action": "scene", "value": "table" }
```

```json
{ "sequence": "tabs-inspection-1", "action": "scene", "value": "tabs" }
```

For Table, revision0 starts unsorted with three rows, revision1 changes header
and row text, revision2 rejects sort requests, and revision3 supplies40 rows.
Sorting must originate in OS/UIA input on the actual plugin header. An accepted
request updates the sort readout and row order; its activation records
`table-sort:<JSON state>` and the fixture revision. The many-row case adds no
scroll wrapper: inspect and record the actual Table behavior before implementing
its scrolling prerequisite. Do not qualify Table structure from its header
Button peer alone.

For tabs, revision0 starts on `first`, revision1 selects `third` programmatically,
and revision2 retains `first` after a selection request. `Unavailable` is always
disabled; the `disabled` command also disables `Third`. Real input records
`tab-selection:<value>` with the fixture revision. The selected value and matching
panel content are readable independently. Verify TabItem/SelectionItem, one Tab
stop, arrow selection, disabled skipping, callbacks and panel visibility; the
generic implementation does not gain those semantics from this fixture.

Both scenes have before/after focus anchors. Use the ordinary `mounted` command
for removal/remount and `snapshot` for numeric native frames. Only props and
mount state are controlled by commands; neither scene provides an action
dispatch command. Preserve failed UIA/geometry/input captures, keep final gates
pending, and use the same fresh-main package required by the plan.

## Inspect menus and anchored layers

The `selector`, `dropdown-menu` and `layer` scenes exercise the public Selector,
DropdownMenu and direct context-mode useLayer paths. They declare their Screen
owner. No substitute menu peers, keyboard adapter or dismissal implementation
is added by these fixtures. Select a scene through the recorded command channel:

```json
{ "sequence": "selector-inspection-1", "action": "scene", "value": "selector" }
```

Use `"dropdown-menu"` or `"layer"` as the value to inspect the other paths. Open
them with actual OS/UIA input on the named trigger. Read the numeric native
snapshot and UIA surface/trigger frames before checking anchoring or choosing an
outside click point. The before-focus anchors have IDs ending in `-outside`;
use one only when its actual bounds lie outside the surface. A flipped or wide
surface can cover a candidate target. For native frames, request a snapshot:

```json
{ "sequence": "layer-snapshot-1", "action": "snapshot" }
```

Each fixture keeps open state while names and callbacks change. Selector's
controlled value starts at `first`, changes to `third` at revision1, and rejects
selection changes at revision2. DropdownMenu and direct useLayer reject requested
open-state changes at revision2. Use revision0 or1 for ordinary dismissal checks.
For example, change props while the surface is open:

```json
{ "sequence": "layer-revision-1", "action": "revision", "value": 1 }
```

Open/close requests produce a separate event from action callbacks. Count them
by source and launch ID to detect duplicate dismissal. This is an example
payload shape, not a captured result:

```json
{ "bootId": "launch-id", "event": "layer-open-change", "source": "selector", "open": false, "fixtureRevision": 1 }
```

Selection/item callbacks still use `activation`: `selector-value:<value>`,
`menu-first`, `menu-disabled`, `menu-third` and `layer-content`, with the current
fixture revision. The `Unavailable` option/item is always disabled. The existing
`disabled` command controls the trigger, and `mounted` removes/remounts the
fixture while retaining its declaring owner. Remount starts closed. Commands
never open a surface or dispatch its item/action callbacks:

```json
{ "sequence": "layer-unmount-1", "action": "mounted", "value": false }
```

These scenes have not been compiled or run on Windows. They provide no pass for
anchoring, outside dismissal, Escape/focus return, option/menu roles, arrow
navigation, controlled ownership, geometry or cleanup. Direct useLayer is a
separate prerequisite from the two final component gates. Preserve failures and
qualify them from the same fresh-main MSIX required by the plan.

## Run the legacy Flexbox regression

This opt-in case exercises NativeScript Flexbox, separately from the Mason
shrinking-row case. It requires the matching preferred-size Core patch and
Widgets DLL/WinMD pair described in the
[repair note](../../.agents/docs/windows-layout-repair.md#automatic-fixed-size-shrink-candidate).
The repository host selects that pair, and its Vite guard rejects a stale
installed Core module. A package built from the older padding-only baseline
is expected to fail the automatic-shrink assertions.

With the matching repair packaged, use a fresh PowerShell process in the signed-in
desktop session, the same device/input reservation, and a new output directory:

```powershell
powershell.exe -NoProfile -NonInteractive -File .\tools\windows-qualification\layouts.ps1 `
  -ExpectedCommit $sourceCommit `
  -ExpectedPackageVersion $packageVersion `
  -OutputDirectory "$runRoot\legacy-layout" `
  -LegacyLayout
```

Set `$sourceCommit` and `$packageVersion` to the candidate package's exact source
commit and MSIX version. Add `-AllowDirtyProbe` when recording a diagnostic
overlay; it does not qualify a final clean-main build.

The driver checks padding, automatic85+85 shrink, fixed-size updates, a column
axis change, moving a child to StackLayout, updates outside Flexbox, reparenting,
`auto`, and remounting. It records the loaded Widgets hash, UIA captures and
native frames. Fixture commands select states0–7 and never set preferred native
sizes or activate input handlers. This is a layout/lifecycle regression; it does
not qualify the 20 public components or their OS input behavior.

## Run Selector input checks

Run `actions.ps1 -SelectorActions` in the signed-in desktop session with the
same required source/package/output arguments as the other action modes. It
uses the maintained `selector` scene and real OS input; fixture commands only
change props and mount state.

```powershell
.\actions.ps1 -SelectorActions -ExpectedCommit $commit `
  -ExpectedPackageVersion $version -OutputDirectory $newEvidenceDirectory
```

The run checks the single-select ComboBox and SelectionItem peers, finite and
ordered option/shared-content frames, one closed Tab stop, F4 opening, arrow
preview, Enter/mouse commits, Escape/focus return, one outside close request,
retained names/callbacks, controlled rejection, disabled input, remount and
measured trigger resizing.
It preserves failures and helper hashes. Search, multiple selection, clear,
groups, long-list scrolling, Narrator, visual parity and the final fresh
current-main package remain separate gates. Do not qualify those from a pass.
