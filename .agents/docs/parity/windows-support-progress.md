# Native Windows maintenance and qualification

Use this page to scope changes to the experimental WinUI target. Keep run
histories, inventories, component dispositions, and pending checks in Silo/local
files. Use [operational evidence lookup](../exploration.md#operational-evidence)
to locate historical reports without treating them as current instructions.

## Find the owning guidance

| Task | Read |
| --- | --- |
| Set up or build the host | [Windows host runbook](../windows-test-host.md), [lab findings](../windows-lab.md) |
| Change a shared control | [Windows UI contracts](../windows-ui.md), [component inventory](../exploration.md#operational-evidence) |
| Change input, pointer, layout, or text plumbing | [Input repair](../windows-input-contracts-repair.md), [pointer repair](../windows-pointer-repair.md), [layout repair](../windows-layout-repair.md), [rich-text repair](../windows-rich-text-repair.md) |
| Inspect retained source repairs and fixtures | [Qualification tooling](../../../tools/platform-qualification/README.md) |
| Assess export presence | [Desktop source audit method](native-desktop-support.md) |
| Change routing or modal ownership | [Routing contracts](../notes/routing-contracts.md), [navigation checks](../navigation-checks.md) |

## Evidence that must remain bounded

Read `windows_checks` before choosing or qualifying a control. Exact source
revision, packaged artifact, architecture, input mechanism, and bounded assertions
belong with each execution record. A successful common-flow fixture does not
establish the full component props, Field/lifecycle, or platform matrix.

Keep handler dispatch, OS input/UIA, Narrator, hardware touch/pen, geometry, visual
parity, downstream consumers, other architectures, and other Windows versions as
independent evidence. Mocked keyboard contracts are not OS-input results; static
UIA names/boxes are not Narrator evidence. A clean install is a separate gate
from component behavior or MSIX production.

## Keep upstream repairs visible

Retained source patches and fixtures live under
`tools/platform-qualification/`; applied consumer patches remain canonical in
`packages/cli/patches/`. Keep their owning NativeScript preview commits and
removal conditions with the relevant repair note and patch manifest.

Distinguish explicit synchronous filesystem bridge calls from
projection failures; do not turn a failed existence query into “missing file.”
Input subscriptions, pointer capture, composition, controlled rollback, and
modal focus restoration require lifecycle cleanup and stale-work rejection.
Use the linked repair notes for each contract rather than reconstructing it
from a successful launch or an export declaration.

Mason's shared component path differs from NativeScript FlexboxLayout. Do not carry a Flexbox-specific binary repair into the shared Mason path without
a reproduction. The foreign-text measurement investigation examined beta.126;
check the adopted MasonKit source and current bounds before retaining a fix or
claiming it is no longer needed.

## Core-20 qualification result (1.0.0.196)

All 20 core components passed OS/UIA qualification on one packaged x64 MSIX —
`org.octanexplat.windows61` 1.0.0.196 (sha256 `42ae47f264d99c83b1c5376381323e562a0a91bffea7f69c8f751406a17d44fe`),
built on Windy from literal `main` `2a5f1219e` — a fresh `bun install --frozen-lockfile`
and `build:windows` on the checked-out `main` tree itself. Ten external driver modes on the one
installed package: actions 258, list-item 97, display 352, tabs 139, selector
289, menu 370, table 86, layer 108, layer-focus 25, structure 194 assertions —
all passed (menu needed one retry — a driver-side snapshot raced the native
relayout after a window resize; identical driver passed 370/370 on retry, recorded
in `feedback_observations`). Per-component rows: `windows_checks` `scenario:windows-os-*` —
see [windows-setup.md](../../../docs/platform/windows-setup.md) for the public
summary. Bounds still open: Narrator, visual parity, touch/pen, ARM64,
downstream consumers, full props matrices, other Windows versions.

Two host constraints met during the gate: `Add-AppxPackage` must run in the
interactive session (plain SSH fails `0x80070005` "Failed to initialize PLM") —
use `normal-task-helper.ps1`; and each driver run needs a fresh evidence
directory.

## Service-adapter qualification result (1.0.0.200)

The platform service adapters passed bounded packaged qualification on
`org.octanexplat.windows61` 1.0.0.200 (sha256
`98376f3196ef927b7b0d0ae1a73725adbd9ab72958f6b3d88e61afde931afd26`), built on
Windy from literal `main` `de325cba9` — a fresh `bun install --frozen-lockfile`
and `build:windows`. The `windows-qualification` fixture runs one
`-ServiceActions` driver mode with `-ServiceSpecs` selection over ten spec
families — clipboard, random bytes, storage, keep-awake, connectivity, device,
app info, files, core filesystem, storage persistence — 39 assertions passed on
the first launch (`mvziceda`). A second fresh launch ran `storage-verify` and
read back the persisted value (`mvziigrl`), qualifying cross-launch preference
persistence. Bounded evidence is recorded on the `windows_checks`
`scenario:windows-service-adapters`, `windows-app-info`, `windows-keep-awake`,
`windows-native-connectivity`, `windows-core-filesystem` and `windows-file-io`
rows, which remain pending — nontext clipboard formats, auth-unavailable,
suspend/resume, physical sleep, architecture matrix, chunk bounds and
cancellation are not yet exercised.

Two upstream gaps surfaced by the gate are recorded in
[upstream-limitations.md](../upstream-limitations.md): NativeScript's Windows
`ApplicationSettings` path is unusable because
`ApplicationData.LocalSettings.Values` projects as an opaque handle (no
`IMap` member is callable — the platform leaf therefore persists preferences as
a JSON document in local state), and the upstream `File` `*Sync` text APIs are
fake-sync (they schedule a WinRT async operation and return before it
completes). The fixture verifies file content through the real async
`File.readText`/`writeText` path and retains the sync behavior as evidence.

## Input, scroll, and extended-service result (1.0.0.201–1.0.0.202)

The maintained `input` and `scroll` qualification scenes plus the extended
service specs passed bounded packaged qualification on
`org.octanexplat.windows61` 1.0.0.201 (sha256
`3ce1ce01b9bc26fc6e091776edafebb3ebb4e1ae59e480bf57e36ef41ebc042e`, source
`79e5ff170`) and 1.0.0.202 (sha256
`bdbbe98a3548bdf7aec6189fb3c5a1617295dd7ca1e4a983cedc14cfbb4a04c9`, source
`550b4ec68`), built on Windy from literal `main` with a fresh frozen install.

- `windows-controlled-text-write`: 48/48 assertions (launch `mvznsuxc`) —
  physical `SendInput` typing reaches a controlled `TextInput`, `onChange`
  emits per temporally-distinct edit, changed/same-length/shrinking/unchanged
  controlled writes, OS-selected range preservation and shrink clamp through
  UIA `TextPattern`, no synthetic echo on unchanged writes, secure
  `PasswordBox` peer (`IsPassword`, no plaintext in raw key events),
  readonly/disabled rejection, `Form user` → `Form pass` Tab order,
  focus/blur events, consumed vs submitting Return, unmount and remount.
- `windows-scroll-observation`: 16/16 assertions (launch `mvznv4ny`) — initial
  overflow edge state, physical wheel moves off start/reaches end/returns,
  content shrink clears and growth restores overflow, viewport readout
  bounds before and after window resize, unmount and remount observer.
- `windows-service-adapters`: 50/50 assertions (launch `mvzoktpm`) — the
  earlier ten families plus `files-chunk` (maxBytes bound + aborted-signal
  `AbortError` via duck-typed signal; the runtime has no global
  `AbortController`), `auth` (session + WebAuthn bounded-unavailable),
  `window-metrics`, `clipboard-nontext` (file-drop preset reads null text),
  `secure-storage`/`secure-persist` (PasswordVault roundtrip), `storage-persist`.
  A fresh boot `mvzoq7ns` ran `secure-verify` + `storage-verify` and read
  back both persisted values.

Bounded evidence is recorded on the `windows_checks` rows for controlled
text write, key-event bridge, scroll observation, secure storage, file IO,
service adapters and media query — all remain pending. Uncovered dimensions
include IME composition, secure swaps and reentrant ordering, OS auto-repeat
projection (a held key emits one `keyDown`; repeats are not routed),
unload/window transitions, clipboard formats beyond null-text, roaming and
production imports for secure storage, partial write/flush failures and
picker initialization, suspend/resume, physical sleep, pointer-variant
predicates, reduced motion, hotplug, secondary windows and the
architecture matrix.

## File-identity depth result (1.0.0.205)

The deeper `files-identity` spec passed on `org.octanexplat.windows61`
1.0.0.205 (sha256 `7241b1bc447748b448ba68e8aca3a77dcef8883cabcff65d338ba21f9f83436d`,
source `f2ec154f5`, frozen install + strict native build gate): same-name
writes keep distinct URIs with each payload intact, both files exist before
release and are deleted by it, and an unowned sentinel file is preserved with
its contents — 12/12 assertions on launch `mw165fr3`, re-verified inside the
20-spec service run `mw165tvb` (70/70). `storage-verify` (`mw166egy`, 8/8)
and `secure-verify` (`mw166r5x`, 9/9) passed on the same package.

The first attempt (1.0.0.204) threw `HRESULT 0x80004005` with no result; the
instrumented 205 spec isolated it to `File.remove()` — upstream
`FileSystemAccess.deleteFile` calls `DeleteAsync` on the pending
`IAsyncOperation`, not the entity — so `File.remove`/`removeSync` never
deletes on Windows. Recorded in
[upstream-limitations.md](../upstream-limitations.md). Fixture cleanup now
deletes through the awaited `toPromise` path; verified on 1.0.0.206 (source
`83e7f2e68`, sha256 `7a221ac038910319b8181797d97c9de565c1b5a605b3d016be4cc2432284b357`)
— `foreignRemoved: true`, no `removeError`, and the full suite passed again
(files-identity 12/12 `mw1708lm`, service 70/70 `mw170ohw`, storage-verify
8/8 `mw171bud`, secure-verify 9/9 `mw171p6y`).

## Service qualification boundaries

The packaged Credential Locker path handles empty strings, an exact U+0001
control-character value, overwrite, remove and fresh-launch persistence.
Same-name sandbox writes produce distinct URIs with exact payloads, both
owned references are deleted by release, and a foreign file survives release
untouched (1.0.0.205 evidence above).

Picker calls still throw `UnavailabilityError`, and export returns `unavailable`.
Require that exact error class in qualification; an unrelated native failure must
not count as explicit unavailability. This result does not qualify owner-window
initialization or a working picker. `PointerDevice` and `UISettings` project on
the host, but their presence does not qualify input predicates, reduced-motion
sampling or notifications.

Look up `scenario:windows-service-adapters`, `scenario:windows-secure-storage`,
`scenario:windows-file-io`, `scenario:windows-picker-host` and
`scenario:windows-media-query` in Silo for retained artifact identities and the
remaining requirements. All five scenarios remain pending. Raw driver results
are indexed under `windows-service203/` in `local_artifacts`.

## Continue qualification

Start from the current pinned dependencies and the maintained host runbook.
Record the exact build revision, artifact identity, actual target and input
method, failures, and remaining gaps. Rerun checks affected by a change rather
than repeating every historical candidate. Source/typecheck evidence,
installation, package build, and OS behavior remain separate results.

Plans are maintained outside `.agents/`. Open work and recipe verification live
in Silo; do not append another implementation sequence to this reference.

## Qualification host constraints

For percentage-width layout cases, give the private host root an explicit
`width: 100%` (through `VStack.width`). An auto-sized root can remain
content-sized even when WinUI assigns a wider frame, making responsive child
cases appear broken. Check numeric host frames as well as UIA bounds:
content-sized accessibility groups do not necessarily describe container frames.
See the [component driver guide](../../../tools/windows-qualification/README.md).

Read a command/event file held open by NativeScript with explicit shared-stream
access; do not silently ignore sharing exceptions. Bound each external UIA read
in a child process so the driver can preserve a timeout and stop its owned app.
A timeout alone does not establish a threading-apartment or upstream filesystem
API defect. Keep each command acknowledgement bound to its launch identity.

Diagnostic overlays and JavaScript replacements in an existing native package
are separate from a fresh source build and final clean-main packaged run.
Harness/scenario qualification does not advance component or issue-wide gates.
Use the [shared-host artifact convention](../host-artifacts.md) and reuse the
host's persistent source checkout while keeping per-run artifacts disposable.


## Native action contracts

Use the [Windows action guide](../../../docs/platform/windows-setup.md#buttons-and-links)
for the shared Button, Pressable and Link surface, and the
[maintained action driver](../../../tools/windows-qualification/README.md#run-action-checks)
for keyboard, pointer, Invoke, state/lifecycle and numeric-frame checks. Native
Click owns activation; do not add a second tap handler to the Mason drawing.

Find the bounded action scenario and exact artifact identities in Silo:

```sh
silo row get windows_checks scenario:windows-core20-actions
```

Keep the final clean-main component rows separate from this diagnostic scenario.
Link has no public disabled prop; injected navigation and external URL launching
need separate evidence. The Windows-only no-callback Tab-stop guard also needs
inclusion in the next source build. Source/controller tests do not establish a
packaged path that has not been run.

## Native panel-tab contracts

Use the [Windows panel-tab example](../../../docs/platform/windows-setup.md#panel-tabs-candidate)
for controlled local panels and the maintained
[tab action mode](../../../tools/windows-qualification/README.md#run-panel-tab-checks)
for native selection, OS input and lifecycle checks. Keep the
[WinUI construction constraints](../windows-ui.md#native-tab-semantics)
beside the adapter; projected class presence and mocked events do not establish
usable native peers.

Read the bounded public-adapter record independently of the final component gate:

```sh
silo row get windows_checks scenario:windows-core20-tabs-public-adapter
silo row get windows_checks scenario:windows-os-tab-list
```

Retain failed UIA/model selection mismatches. Header drawing, native selection,
panel content and Tab order need separate assertions; a callback alone does not
prove they agree. Structural updates, rich-slot geometry, overflow, panel
relations and the full fresh-main run remain separate qualification work.

## Native single-selection contracts

Use the [Windows Selector example](../../../docs/platform/windows-setup.md#single-selection-candidate)
and [Selector input mode](../../../tools/windows-qualification/README.md#run-selector-input-checks)
for the finite single-choice path. Keep framework option content in the packaged
checks: a plain-string ComboBox can expose valid popup bounds while a custom
hosted-content template fails. Preserve the focus-target Grid and typed chrome
accessors described in the [selection constraints](../windows-ui.md#single-selection-controller-candidate).

```sh
silo row get windows_checks scenario:windows-core20-selector-input
silo row get windows_checks scenario:windows-os-selector
```

A bounded diagnostic pass does not qualify search, multiple selection, grouped
or long lists, the full props matrix, Narrator or the final fresh-main package.

## Stream and keep-awake depth result (1.0.0.208)

On `org.octanexplat.windows61` 1.0.0.208 (source `4a38d531f`, bounded): a
512 KiB `files.writeBytes` payload streams back byte-exact across 64 KiB
chunk boundaries; `maxBytes` at exact size passes while one byte under
rejects with the byte-limit error; a mid-read abort rejects with
`AbortError` after three streamed chunks. Keep-awake depth verified:
duplicate tag activation stays true, releasing an already-released or
never-activated tag is a benign availability no-op, a bogus tag release
leaves the shared `DisplayRequest` owned, pair tags release independently,
and a fresh request re-acquires after full release. Service suite: 80/80
assertions (launch `mw19z4a0`); storage-verify 8/8 and secure-verify 9/9 on
relaunch.

## Upstream file-member matrix and connectivity depth result (1.0.0.209)

On `org.octanexplat.windows61` 1.0.0.209 (source `06d4530f4`, bounded): the
`corefs-depth` probe mapped the upstream `File`/`Folder` surface beyond text
IO — `File.lastModified` returns a Date, but `Folder.getEntities`/`eachEntity`
throw `GetFolderFromPathAsync(...).done is not a function` (the fake-sync
`.done()` pattern), `File.rename` and `File.remove` throw the `IAsyncOperation`
`HRESULT 0x80004005`, and `File.size` silently returns `0`. The verified-broken
shapes are now driver-asserted regression guards and recorded in
[upstream-limitations.md](../upstream-limitations.md). `connectivity-depth`
verified subscriber fan-out (identical one-event sequences), unsubscribe
isolation, resubscription, and a stable `online: true, type: "wifi"` state —
real network transitions are not triggerable in-app and stay uncovered.
Service suite: 87/87 assertions (launch `mw1b15su`, rerun with the corrected
driver); files-identity 12/12, storage-verify 8/8, secure-verify 9/9.

## Storage depth and clipboard contract result (1.0.0.210-212)

On `org.octanexplat.windows61` 1.0.0.212 (source `ec8b27728`, bounded; driver
`a7b96646`): storage qualifies deeper — supplementary-plane + `U+0000`
round-trips exactly, an 8 KiB+1 value persists intact, keys stay isolated,
overwrite wins, removing an unset key is a no-op, `flush() === false`.
The WinRT clipboard is verified lossy past BMP ASCII: non-BMP text never
round-trips exactly (ASCII prefix survives, `U+0000` truncates the tail,
mojibake varies across launches — a lone emoji returned `??` on some
launches and the real `😀` on others), `SetContent`+`Flush` commits are racy
(a 350 ms settle models the window), and an empty write reads back `null`
(our leaf's contract). All recorded in
[upstream-limitations.md](../upstream-limitations.md). Service suite: 98/98
assertions (launch `mw1jucpo`); files-identity 12/12, storage-verify 8/8,
secure-verify 9/9.

## Live media-trait delivery result (1.0.0.213)

On `org.octanexplat.windows61` 1.0.0.213 (source `92b4828da`, bounded): real
OS-driven trait-change events deliver — two driver window resizes produced 5
samples (`widthDIPs` 405↔747, `scale` 2) through both `layoutChanged` and
`orientationChangedEvent`, and the observer releases cleanly. Notable: on this
runtime `orientationChangedEvent` fires on any window resize, not only
rotation. The spec subscribes on the primitives `observeWindowsMediaTraits`
uses, not the internal host function itself. Service suite: 103/103
assertions (launch `mw1ku7j8`); files-identity 12/12, storage-verify 8/8,
secure-verify 9/9.

## Picker surface probe results (1.0.0.214-215)

On `org.octanexplat.windows61` 1.0.0.215 (source `4521ec1ed`, bounded): the
WinRT picker surface projects fully —
`FileOpenPicker`/`FileSavePicker`/`FolderPicker` construct and
`PickSingleFileAsync` resolves — but no owner-window path reaches JS:
`IInitializeWithWindow` is unprojected on the picker (no `as`/cast member),
`Microsoft.UI.Win32Interop` is absent so `GetHwndFromWindowId` is
unreachable, and a bounded `PickSingleFileAsync` invoke rejected
synchronously (`FileTypeFilter.Append('*.*')` -> `E_INVALIDARG`,
`PickSingleFileAsync` -> `E_FAIL`). The root
`XamlRoot.ContentIslandEnvironment.AppWindowId` -> `AppWindow` chain does
work, and `NSWinRT` exposes a `win32` member plus `interop.handleOf` that
remain to be probed; the projected picker's `handle` own-property may carry
the `IInspectable` pointer. `files.pick`/`pickMultiple`/`export` stay
bounded-unavailable until an owner window or working invoke is proven.
Service suite: 105/105 assertions (launch `mw2ekg6j`); files-identity
12/12, storage-verify 8/8, secure-verify 9/9. Build 1.0.0.214 (source
`dabf5be01`, sha `e0edd7a6`) passed the same gate at 104/104 with the
first-round probe.

## Picker owner-window probe results (1.0.0.216-221)

On `org.octanexplat.windows61` 1.0.0.221 (source `df288fd3c`, bounded): the
owner-window chain is reachable end-to-end except one marshalling step.
`NSWinRT.win32.call` reaches `GetActiveWindow`/`GetForegroundWindow`/
`GetGUIThreadInfo` for a real owner HWND, `NSWinRT.dotnet.invoke` calls a
managed helper compiled into the app
(`App_Resources/Windows/Interop/ServiceInterop.cs` via `app.csproj`), and
`FileTypeFilter` accepts `Append('*')` while `'*.*'` throws `E_INVALIDARG`.
The blocker: the projected picker crosses `dotnet.invoke` as `System.String`
rather than a `WinRtRef`-backed RCW — `ServiceInterop.Describe` reported
`System.String|IsInitWithWindow=False`, and every `InitializeWithWindow`
assembly path fails with `InvalidCastException` on the CCW for the string.
`PickSingleFileAsync` still rejects (`WinRT async operation failed`) pending
a working carrier (`picker.handle`, `interop.handleOf` wrappers,
`dotnet.wrap`, `interop.pointer` under probe). Prior rounds: 1.0.0.216
(source `d9d7e2949`) mapped the `NSWinRT.win32`/`dotnet`/`proxy` surfaces;
1.0.0.217 (`c7fddeee9`) proved the win32 HWND chain and resolved
`WinRT.Interop.InitializeWithWindow.Initialize` (blocked only on `IntPtr`
arg marshalling); 1.0.0.219 (`3d922b051`) confirmed `System.IntPtr` is
unprojected and `Convert.ChangeType` cannot coerce JS numbers; 1.0.0.220
(`ba2b8077e`) proved `dotnet.invoke` reaches the managed helper. WASDK 1.8
`Microsoft.Windows.Storage.Pickers` is absent on pinned WASDK 1.6 —
confirmed dead end. Service suite: 105/105 assertions across all rounds
(launch `mw2r2pwt`); files-identity 12/12, storage-verify 8/8,
secure-verify 9/9.

## Picker owner-window resolved: managed-side pick (1.0.0.224)

On `org.octanexplat.windows61` 1.0.0.224 (source `25ff9c960`, bounded): the
managed-side pick path displays a real OS dialog without deadlocking the
app. `ServiceInterop.PickSingleStart` enqueued the pick on the captured
`DispatcherQueue` and reported `started`; the pick stayed `pending` for the
full 8-second bound — a live `FileOpenPicker` dialog owned by the app HWND
(`79824446` via `GetActiveWindow`) — while the JS-side
`PickSingleFileAsync` still rejected `WinRT async operation failed`. The
bridge's `AwaitIfTask` on `Task`-returning methods was confirmed as the
deadlock mechanism (build 223's Task-returning pick hung the app
deterministically twice). `files.pick`/`pickMultiple`/`export` are now
implemented on this path: the helper returns `FutureAccessList`
`token|path` entries, JS polls `PickState`, reads resolve through token
grants. Service suite: 105/105 assertions (launch `mw2tzq2d`).

## Production pick/export implemented and dialog-verified (1.0.0.225)

On `org.octanexplat.windows61` 1.0.0.225 (source `b8b502e4e`, bounded):
`files.pick()` — the production leaf path — opened a live OS
`FileOpenPicker` dialog owned by the app HWND (`8521232` via
`GetActiveWindow`) and stayed `pending-dialog` through the 6-second bound
until the driver's Escape cancelled it; a concurrent `files.pick` returned
`files.single: fail:busy`, proving the single-pick guard. The app remained
fully responsive throughout: service suite 105/105 assertions (launch
`mw2v92h6`), files-identity 12/12, storage-verify 8/8, secure-verify 9/9.
`pick`/`pickMultiple`/`export` now run through
`OctaneXplat.Interop.ServiceInterop` (construct + `InitializeWithWindow` +
`DispatcherQueue` enqueue + `FutureAccessList` token grants) because the
projected WinRT objects cannot cross `dotnet.invoke` and Task-returning
bridge calls deadlock the dialog pump. Completed-selection, typed-filename,
and save-commit evidence remain the next qualification increments.

## Pickers fully qualified: completed selection + save commit (1.0.0.227)

On `org.octanexplat.windows61` 1.0.0.227 (source `e82bb1d24`, bounded):
`files.pick` completed a real OS selection — the driver typed
`Documents\core20-pick-target.txt` into the open `FileOpenPicker` and the
leaf resolved `ok:core20-pick-target.txt` with `files.readText` returning
`core20-pick-content` through the `FutureAccessList` token grant.
`files.export` committed through `FileSavePicker` — typed destination
`Documents\core20-exported.txt` verified on disk with the payload bytes —
via the stream write (`FileIO.WriteBytesAsync` rejects on token-granted
files, `HRESULT 0x80004005`). `files.pick`/`pickMultiple`/`export` are
therefore genuinely supported on packaged Windows: dialog display,
completed selection, cancel (`cancelled`/`pending-dialog`+Escape), busy
guard (`fail:busy`), token read-through, and save commit all carry
packaged evidence. Service suite: 110/110 assertions (launch `mw2wh645`);
files-identity 12/12, storage-verify 8/8, secure-verify 9/9. Remaining:
`pickMultiple` multi-select evidence and the upstream issue for the two
bridge limitations (`dotnet.invoke` WinRT-object marshalling; caller-thread
Task await).

## Multi-select qualified: picker scenario complete (1.0.0.228)

On `org.octanexplat.windows61` 1.0.0.228 (source `1a6127bb1`, bounded):
`files.pickMultiple` completed a real OS multi-selection — the driver
typed quoted paths `"Documents\core20-pick-target.txt"
"Documents\core20-pick-second.txt"` into the open `FileOpenPicker` filename
box and the leaf resolved `ok:2` with both names and `files.readText` on
the first ref returning `core20-pick-content` through its token grant.
Every picker surface member is now qualified on packaged Windows:
`files.pick` (completed selection + token read-through), `files.
pickMultiple` (multi-select), `files.export` (typed-destination save
commit verified on disk), dialog display, cancel path, and the `fail:busy`
guard. Service suite: 113/113 assertions (launch `mw2x5hw4`);
files-identity 12/12, storage-verify 8/8, secure-verify 9/9.
