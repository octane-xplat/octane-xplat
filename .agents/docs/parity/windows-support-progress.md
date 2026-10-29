# Windows native support candidates

Issue: [Windows #61](https://github.com/octane-xplat/octane-xplat/issues/61).
This note records implementation candidates after audit commit `720c9ef93`.
The shared [export audit](native-desktop-support.md) remains a historical snapshot;
its TSVs, findings and hashes have not been regenerated during parallel work.

Current bounded native results: Switch passed10common-input groups plus6
repeated async rollback trials; CheckboxInput passed15input/state groups.
The latest [Switch](#v17-qualifies-common-shared-switch-input-flows) and
[CheckboxInput](#v20-qualifies-common-checkboxinput-flows) sections retain exact
artifacts, failed predecessors and qualification limits. Full Windows support
and the broader component rows remain unqualified.

## Priorities and evidence boundary

Prioritize app startup, forms, navigation, overlays, scrolling and everyday
services. `packages/demos/src/ControlsDemo.tsrx` uses Slider, Switch and shared
layout; `FileInputDemo.tsrx` uses attachment selection. `apps/windows` consumes
the shared app and demos. Assume those common flows matter more than optional
billing, ads and specialist integrations.

The initial pass used source inspection, targeted lint/format, syntax/manifest
checks and diff review. That source-only pass did not compile, launch Windows,
exercise OS input/UIA, install packages or qualify packaging/distribution.
Subsequent authorized laptop results are recorded below. Screenshots and visual
analysis have not been used.
The existing source audit is not runtime proof. No evidence-gated issue checkbox
is complete because of these changes.

## Initial candidates

This table preserves the initial source-pass dispositions. Later sections
record the narrower runtime assertions and their remaining gates.

| Area | Candidate | Remaining boundary |
| --- | --- | --- |
| UI import | Native preset includes the Windows condition; UI root has a Windows export and neutral KeyboardAvoiding | Production import graph and packed declarations need verification; mobile status-bar imports are excluded from this root |
| Animated-image import | GIF manifest selects the existing Windows entry instead of an explicit mobile visual import | Existing unsupported placeholder remains; no GIF playback claim |
| Command palette | Unsuffixed announcement import selects a WinUI automation-peer leaf | Screen-reader delivery and peer projection unverified |
| Dialogs/sheets | Windows keyboard-overlay host resolves independently of the mobile-only helper | Neutral software-keyboard binding; Windows occlusion, modal focus/Tab/Escape/background exclusion and OS dismissal remain unqualified |
| Floating layers/focus return | Dedicated NativeScript useLayer leaf; Windows XamlRoot-scoped return helper uses the declaring host | Minimal resolver and mocked focus contracts only; native mounting, geometry, activation/identity projection, Tab/IME and focus remain unqualified |
| Media queries | Windows leaf samples fine/coarse/hybrid pointer, pen hover and animation preferences; listens to root layout and app lifecycle/resize | Standalone NativeScript input/preference projection passed with synthetic screen size; hook rendering, real resize, hotplug/settings events and secondary windows unqualified |
| Gradient controls | Windows LinearGradientBrush helper supplies the previously missing leaf | Native bridge projection, repaint ownership and pixels unverified |
| Files | Windows-only text/binary I/O leaf removes the mobile document-picker import; bounded reads, owned temporary writes and cleanup | Standalone reads/writes and owned-only release passed against a task folder; packaged TemporaryFolder, cancellation, deterministic cleanup and picker/export unqualified |
| Clipboard | WinRT text read/write, format check, async bridge, flush, false/null failures | OS clipboard access, foreground restrictions and persistence need Windows checks; rich formats excluded |
| Random | WinRT CryptographicBuffer entropy, bounded hex conversion, byte-range preservation | Standalone NativeScript byte bounds/chunks passed; production app integration unqualified; no JS PRNG fallback |
| Controlled text | Windows text-write leaf preserves TextBox selection around guarded value updates | Mocked range/lifecycle tests only; actual WinUI selection, IME, secure fields and focus unqualified |
| Scroll observation | Windows useScrollableArea composes viewport/content layout, scroll and lifecycle handlers | Scripted-hook/fake-metric contracts only; real compiler/renderer, Mason measurements, OS scrolling and RTL unqualified |
| Connectivity/query environment | Windows WinRT profile-level reader and native environment export; shared monitor ownership and stopped-listener guards | 17 focused contracts and one native snapshot comparison passed; reconnect/event delivery, app/window lifecycle and real query refresh unqualified |
| Keep-awake | Windows WinRT DisplayRequest with deduplicated tags, direct core UI dispatch and suspend/resume/exit cleanup | 12 focused contracts and native construction/method projection passed; actual grants, UI-thread/app lifecycle and physical sleep prevention unqualified |
| Credentials | Package-family-scoped PasswordVault adapter avoids mobile plugin fallback | Standalone task-namespace operations/cleanup passed; actual packaged identity, persistence across launches and policy behavior unqualified |
| Device | Explicit Windows OS identity, core metadata | Version/model/language metadata unqualified |
| App metadata | Windows appInfo lazily reads package identity and four-part version | Four mocked contracts and standalone unpackaged-unavailable result passed; packaged values, startup and production integration unqualified |
| App settings | Package-family-specific Settings URI; unavailable without package identity | Packaged and unpackaged host behavior, launch acceptance and navigation unqualified |
| Preferences | Windows leaf preserves ApplicationSettings string operations and returns false for unconfirmed blocking flush | OS persistence/crash durability unqualified; no blocking commit API bound |
| Auth session | Explicit unavailable Windows leaf rejects with UnavailabilityError | Hosted OAuth/WebAuthn callback/activation adapter still missing; this corrects availability, not auth support |

Underlying SDK references: [clipboard text](https://learn.microsoft.com/en-us/uwp/api/windows.applicationmodel.datatransfer.clipboard.getcontent),
[brushes](https://learn.microsoft.com/en-us/windows/apps/develop/platform/xaml/brushes),
[CryptographicBuffer](https://learn.microsoft.com/en-us/uwp/api/windows.security.cryptography.cryptographicbuffer),
[Settings URIs](https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-settings).
These document OS APIs, not the preview NativeScript projection.

## Deferred commands and qualification

The human subsequently authorized focused testing through `ssh windy`.
Connection to the Windows laptop succeeded. Targeted results will be recorded
separately; the following broad/package checks remain deferred. Run these from
the repository root when those verification phases are authorized:

```sh
pnpm exec turbo run build --filter=@octane-xplat/cli
pnpm exec turbo run test --filter=@octane-xplat/cli
pnpm exec turbo run test --filter=@octane-xplat/platform
pnpm exec turbo run test --filter=@octane-xplat/files
pnpm exec turbo run test --filter=@octane-xplat/ui
pnpm exec turbo run test:native --filter=@octane-xplat/ui
pnpm exec turbo run test:packed --filter=@octane-xplat/gif
pnpm exec turbo run typecheck --filter=...@octane-xplat/cli
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run typecheck --filter=...@octane-xplat/platform
pnpm exec turbo run typecheck --filter=...@octane-xplat/files
pnpm exec turbo run typecheck --filter=...@octane-xplat/gif
```

Host-contract regressions are in
`packages/platform/tests/windows-services.test.mjs`; their focused laptop run is
recorded below. The Windows resolver subtest in
`packages/cli/test/vite-native-runtime.test.mjs` remains unexecuted. Neither is
WinRT or OS evidence. The CLI test uses a fake package to isolate condition
selection; the real package graph still needs production qualification.

After permission, use the [Windows test-host runbook](../windows-test-host.md)
for the real host and its resource reservation. From the authorized Windows
checkout, build the private harness with:

```sh
pnpm exec turbo run build:windows --filter=@xplat/windows
```

Then run explicit native checks for clipboard Unicode/empty/nontext/busy cases,
random bytes and subviews, packaged/unpackaged app settings, device metadata,
controls, overlays and automation-peer announcements. The probe runner excludes
Windows; do not substitute a successful mobile probe for Windows evidence.

## Recipes and remaining work

Reviewed `platform-leaves`, `shared-overlays`, `keyboard-clipboard` and
`passkey-sign-in`. Windows remains outside these recipes' supported targets;
existing criteria and maintained examples are unchanged. Source candidates do
not add a supported downstream Windows workflow. Public service guidance and
the Octane services skill distinguish the candidates from qualification.
`recipe_audit.target` currently accepts only web/iOS/Android/macOS: do not insert
Windows coverage under another target or weaken the schema during parallel work.

Lightweight checks passed: targeted lint (after correcting the inherited default
announcement helper), syntax-only transpilation of ten new TypeScript files,
Node syntax checks of regression files and targeted diff whitespace checks.
These are not type, behavior or runtime checks.

Recipe structure/local links passed with `pnpm check:recipes`.
`pnpm check:changelog` validated ten notes after temporarily reusing the existing
installed yaml dependency; the isolated worktree has no dependency install.

Next high-demand work: inspect native keyboard/focus and scroll geometry before
specialist packages; qualify file picker window ownership and core persistence.
Keep the layout binary adoption and explicit-width flex overlap gates open.

## Focused Windows host-contract run

At source revision `88a67da75`, all five tests in
`packages/platform/tests/windows-services.test.mjs` passed on `windy`
(Windows x64, Node 24.13.1, pnpm 12.15.0, Turbo 2.11.4; exit 0).
The isolated scratch workspace was `dev/octane-windows61-checks-88a67da`.
Its node_modules junction reuses the existing qualification checkout's installed
tooling; no install, native build or old experiment change was needed.

```powershell
Set-Location "$env:USERPROFILE/dev/octane-windows-qualification"
pnpm exec turbo --cwd "$env:USERPROFILE/dev/octane-windows61-checks-88a67da" run test --concurrency=1
```

These execute our TypeScript adapters against mocked projected APIs. They prove
error paths, bounds and dispatch contracts only; they do not execute NativeScript
or WinRT, inspect the user's clipboard, exercise settings navigation, or establish
secure entropy from the actual runtime. The CLI resolver regression, full
package suites, declarations and all native qualification remain pending.

The opensrc cache labeled `abae298` lacked Windows implementation files, so the
Windows core sources were read directly from the upstream GitHub commit
`abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b`.
[Color source](https://github.com/NativeScript/NativeScript/blob/abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b/packages/core/color/index.windows.ts)
uses plain rounded ARGB structs; the gradient candidate follows that shape.
[Utils source](https://github.com/NativeScript/NativeScript/blob/abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b/packages/core/utils/index.windows.ts)
returns true when an async URL launch is submitted, before OS acceptance.
Accordingly, the settings candidate's boolean is request submission only.
[ApplicationSettings source](https://github.com/NativeScript/NativeScript/blob/abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b/packages/core/application-settings/index.windows.ts)
returns true from a no-op flush, relying on OS persistence; this is not a
blocking durability confirmation. The Windows leaf reports false instead. These are upstream source findings,
not runtime qualification.

A follow-up run on the same scratch workspace passed seven tests (six platform
contracts plus the Windows gradient projection regression), exit 0. The source
overlay added `storage.windows.ts` and replaced ColorHelper calls with plain ARGB
structs. Raw output: `research/windows61/windy-contracts-followup.log`. The UI
regression is maintained at `packages/ui/tests/windows-gradient.test.mjs` and
included in `test:native`; the full suite is still deferred.

The same upstream commit supplies a concrete
[view-relative coordinate method](https://github.com/NativeScript/NativeScript/blob/abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b/packages/core/ui/core/view/index.windows.ts#L1207).
Do not treat the older no-op-coordinate record as proof that this preview lacks
source support. Geometry under actual scrolling remains unqualified. The shared
`useKeyboard` still reports no native hardware-key attachment; the reviewed core
View file does not forward KeyDown/KeyUp. A target input adapter and actual
keyboard/focus checks remain necessary before claiming shared-keyboard support.

## Windows file I/O candidate

`packages/files/src/files.windows.ts` selects a Windows service without importing
`@nativescript-community/ui-document-picker`. It implements text reads/writes,
64 KiB binary streaming, maxBytes checks before and during reads, cancellation,
partial-write/flush failure handling, unique temporary copies and owned-only
asynchronous release with retry. External references are never released as owned
files. Temporary copies are not durable documents.

The six maintained regressions at `packages/files/tests/files.windows.test.mjs`
passed through the same isolated Turbo fixture on `windy` (13 total focused tests,
exit 0). Raw output: `research/windows61/windy-files-contracts.log`. They use mocked
projected APIs, not real files or WinRT. Actual `DataReaderLoadOperation`, uint32
write-result and boolean flush-result projection remain unqualified, as do
ApplicationData availability and packaged filesystem permissions.

Picker operations explicitly reject `UnavailabilityError`; export returns
`unavailable`. The installed runtime package exposes no public bridge declaration
for initializing a picker with a window, and no such adapter is qualified in
this repository. This does not prove a bridge implementation is impossible.
Microsoft's [desktop picker requirements](https://learn.microsoft.com/en-us/windows/apps/develop/files/using-file-folder-pickers#use-winrt-pickers-with-hwnd-interop)
require HWND initialization for legacy pickers. SDK 1.8's newer WindowId-based
picker is not a reason to claim support on the existing 1.6 preview host.

Read the [Windows Files subset](../../../packages/files/README.md#experimental-native-windows-file-io)
before using the service. The `date-picker` recipe owns FileInput's default-picker
workflow and excludes Windows; its criteria remain unchanged. No downstream
Windows picker workflow or recipe completion is claimed. Silo's recipe target
constraint still prevents Windows assessments.

## Resolver-test environment boundary

The isolated laptop fixture attempted the maintained
`packages/cli/test/vite-native-runtime.test.mjs` after bundling the committed CLI
preset sources through Turbo and the existing esbuild 0.27.7. The small bundle
build succeeded. Its runtime import of `@octane-xplat/lib/server-boundary` was
satisfied with the committed library source; the older laptop dependency graph
then lacked `@babel/core`, so the maintained test could not start. This is an
environment dependency failure, not a failed Windows-condition assertion or a
passing resolver test. No dependency install was performed.

```powershell
Set-Location "$env:USERPROFILE/dev/octane-windows-qualification"
pnpm exec turbo --cwd "$env:USERPROFILE/dev/octane-windows61-checks-88a67da" run test:resolver --concurrency=1
```

Raw output: `research/windows61/windy-resolver-contracts.log` (exit 1 before the
regression body). Use a current, separately installed qualification checkout
before rerunning the maintained CLI test and production import graph. The
scratch bundle is not the package build or a native app artifact.

## Windows media queries and current metric source

The source at pinned NativeScript commit `abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b`
already derives [Screen.mainScreen DIPs](https://github.com/NativeScript/NativeScript/blob/abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b/packages/core/platform/screen/index.windows.ts)
from the primary window's XamlRoot and [emits orientationChanged on resize](https://github.com/NativeScript/NativeScript/blob/abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b/packages/core/application/application.windows.ts#L302).
The earlier audit's missing-window-resize description must not be treated as
proof of absence in this preview. No replacement sizing mechanism was added;
actual resize geometry remains unqualified.

`use-media-query.windows.tsrx` adds a Windows input/animation capability leaf.
The shared fallback's fixed coarse/no-hover traits misclassify mouse desktops;
its grammar does not recognize the reduced-motion query used by
`useStreamingText`. Existing adaptive-dialog and menu examples under
`apps/astryx-sandbox/src/examples` also use the compact-touch query. The new
helper keeps primary input, hybrid any-pointer support and unknown host data
distinct. The preference order is mouse, pen, touch. Pen hover uses reported
MaxPointersWithZDistance; missing capability data does not become none/false,
and negation does not turn an unknown predicate into a match.

The leaf retains a restricted native grammar: px/DIP width/height bounds and
exact values, orientation, pointer/any-pointer, hover/any-hover,
prefers-reduced-motion, and/or/comma and per-term not. It does not promise the
browser's full CSS grammar. The existing [core query engine](https://github.com/NativeScript/NativeScript/blob/abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b/packages/core/css-mediaquery/index.ts#L73)
rejects string-valued pointer/hover features, so it cannot supply this behavior.
No UI dependency was added. Root loaded/layoutChanged and application
resize/launch/resume events resample the primary window. Input-device hotplug,
settings-change notifications and secondary-window ownership remain unqualified;
this does not implement hover event dispatch or focus modality.

Six new tests at `packages/ui/tests/windows-media-query.test.mjs` passed on
`windy` in the isolated Turbo fixture (19 focused tests total, exit 0). They cover
hybrid input, touch/pen/no-pointer and unknown states, query bounds/precedence,
root rebinding/disposal and reduced-motion sampling. One initial failure was a
missing animation-preference default in the test fixture; after correcting the
fixture, the complete focused run passed. Raw output:
`research/windows61/windy-media-contracts.log`. The helper was transpiled for
Node; the hook leaf has lint/syntax evidence only, not native renderer execution.

Four additional read-only Windows PowerShell/.NET checks instantiated
MouseCapabilities, TouchCapabilities and UISettings, checked numeric/boolean
property types and called GetPointerDevices. All passed (exit 0), without logging
hardware identities, capability values or user preference values. Raw output:
`research/windows61/windy-input-api-types.log`. These prove OS API availability
in that .NET/SSH process, not NativeScript bridge behavior. API references:
[input capabilities](https://learn.microsoft.com/en-us/windows/apps/develop/input/identify-input-devices),
[pen hover capacity](https://learn.microsoft.com/en-us/uwp/api/windows.devices.input.pointerdevice),
[animation preference](https://learn.microsoft.com/en-us/uwp/api/windows.ui.viewmanagement.uisettings.animationsenabled).

The native UI test task includes this helper regression. The full UI suite,
package/dependent typecheck and actual NativeScript renderer/runtime checks
remain deferred. Public Windows guidance and the styling skill record the
subset. No supported downstream Windows workflow or recipe target was added;
responsive examples already use the shared import and require no source change.

## Standalone NativeScript DLL checks on windy

Using the existing `@nativescript/windows@0.1.0-alpha.144` x64 DLL, a short-lived
PowerShell process initialized the runtime, ran transpiled source, consumed the
last-JS-error diagnostic and deinitialized it. No native build, dependency
install, package registration or app launch was performed. Device ownership was
reserved with `goddard-agent resource run` using `exclusive: ["device:windy"]`.
The DLL was read from the existing experiment's
`apps/windows/platforms/windows/libs/x64/nativescript.dll`; SHA-256:
`748D95864AC032DE2D1BB69FEC1E5B2CDD393BAA1671E349AA670160AA66D47C`.

Three focused checks passed, each exit 0 and its explicit success marker:

- Random: the actual CryptographicBuffer projection filled a 70,000-byte
  DataView spanning two chunks, preserved surrounding sentinel bytes and
  returned the same view; a separate 32-byte request retained its length.
  This does not statistically certify entropy. Log:
  `research/windows61/windy-native-random.log`.
- Input capabilities: actual mouse/touch property types, pointer-vector
  Size/GetAt, pointer enum comparison and animation-preference projection
  passed. The helper produced known traits. Screen was deliberately supplied
  as a synthetic 800×600 object; no hook, geometry, resize, hotplug or UI event
  claim follows. No hardware/preference values were logged. Log:
  `research/windows61/windy-native-media.log`.
- Files: the updated source read every byte of a task-owned 70,000-byte fixture
  across 64 KiB chunks, rejected a 69,999-byte limit and read UTF-8 text including
  a snowman. This used actual StorageFile/WinRT async operations and timer/message
  pumping. Log: `research/windows61/windy-native-files.log`.

The file probe exposed gaps hidden by the mocks. `OpenReadAsync` returned a
projection without inherited GetInputStreamAt; the leaf now requests the input
interface directly through OpenSequentialReadAsync. GetBasicPropertiesAsync
supplies the initial size bound. DataReader.LoadAsync then caused an access
violation in this standalone host after requesting the load; two isolated
processes reproduced it. This does not establish whether the packaged WinUI
host has the same fault. Direct IInputStream.ReadAsync with bounded Buffer
objects passed and replaces that route. Input-stream Close is also absent in
this projection, so explicit close remains best effort and reclamation depends
on runtime proxy release. Deterministic handle cleanup is **not** qualified.
Failure logs: `windy-native-files-sequential-crash.log`,
`windy-native-files-load-crash.log`, `windy-native-files-close-projection.log`
under `research/windows61/`. An initial fixture path used mixed separators;
canonicalizing the task-owned Windows path resolved its earlier async-open
error. Neither that fixture error nor the native crashes are passing evidence.

Task-owned reproduction files remain on windy at
`C:\Users\alecs\dev\octane-windows61-checks-88a67da`: `native-media-probe.ps1`,
`native-files-probe.ps1`, and `native-smoke/random-smoke.js`. The probes inline
transpiled repository implementations after removing imports; file-byte helpers
are included, and media uses synthetic Screen/Application objects. They do not
exercise production export resolution, bundling, hooks or the full app. Repeat
one probe under a device reservation, for example:

```sh
goddard-agent resource run --json '{"resources":{"exclusive":["device:windy"]},"purpose":"Focused Windows file-read probe"}' -- ssh windy 'powershell -NoProfile -File C:/Users/alecs/dev/octane-windows61-checks-88a67da/native-files-probe.ps1'
```

After updating the stream-shaped fixture, all 19 focused mocked contracts passed
again through the isolated Turbo task (exit 0), including read cancellation,
size growth and cleanup where the host supplies Close. Log:
`research/windows61/windy-direct-stream-contracts.log`. App-host writes,
ApplicationData/package identity, cancellation, deterministic cleanup, release,
pickers/export and production imports still need qualification. Full package
checks and the exact deferred commands above remain deferred. No evidence-gated
issue checkbox or supported recipe target was closed by these probes.

## Windows output-stream projection repair

A follow-up standalone alpha.144 x64 DLL probe reproduced
`TypeError: stream.WriteAsync is not a function` after successful CreateFileAsync
and OpenAsync. The failure path deleted the new copy. The binary writer now
requests `GetOutputStreamAt(0)` from IRandomAccessStream, writes and flushes that
IOutputStream, then attempts cleanup of both projections. Its mocked parent
stream deliberately has no WriteAsync/FlushAsync. A new regression verifies that
failure acquiring the output still closes the parent where supported and removes
the new file. No fallback to unbounded FileIO or mobile plugins was added.

The updated source passed actual WinRT write/read round trips for a 70,000-byte
offset view spanning two write chunks, an empty byte view, and repeated names
that produced distinct paths. Unicode/CRLF text writes round-tripped unchanged.
After files.release, the owned text file was absent; a foreign task fixture
remained readable. Release completion was checked after native async pumping,
then independently checked through StorageFile.GetFileFromPathAsync. The binary
fixtures were explicitly deleted by the probe. All use canned data. Logs:
`research/windows61/windy-native-write-missing-method.log` (reproduction) and
`research/windows61/windy-native-write.log` (final success, exit 0, both explicit
write and release success markers).

The probe supplies an actual StorageFolder for the task's scratch directory in
place of ApplicationData.Current.TemporaryFolder. All other file, stream, buffer
and async operations use the real projection. This qualifies that folder's
I/O and owned-release behavior, **not** packaged app identity or the app's
TemporaryFolder. Production imports, packaged WinUI integration, cancellation,
partial-write/flush-failure injection and deterministic stream cleanup remain
unqualified. No native build/install/package registration/app launch occurred.

The write probe initially failed during setup because its top-level Windows
binding collided with the runtime global. Wrapping the inlined implementation
in a local function fixed the probe. A release-polling attempt also found no
setTimeout in the bare runtime (the normal app obtains timers through core);
the final probe uses host-driven phases and pumps native completions. Neither
setup error is evidence of a file-service failure or pass. The probe now checks
the initial JavaScript diagnostic before the completion assertion.

The task-owned runner on windy is `native-write-probe.ps1` beside the earlier
probe files. Repeat under the same device reservation:

```sh
goddard-agent resource run --json '{"resources":{"exclusive":["device:windy"]},"purpose":"Focused Windows file-write probe"}' -- ssh windy 'powershell -NoProfile -File C:/Users/alecs/dev/octane-windows61-checks-88a67da/native-write-probe.ps1'
```

The final focused Turbo suite passed all seven file tests, 20 mocked contracts
in total (exit 0). Its result is recorded separately from the native probe in
`research/windows61/windy-output-stream-contracts.log`. Broad package checks and
all exact deferred commands above remain deferred. No evidence-gated issue row
or recipe target is closed by this subset.

## Native Windows Credential Locker candidate

Common session persistence is the next everyday-service gap after file I/O.
The shared hosted-auth adapter calls secureStorage from persist/readStoredCredentials;
`packages/app/src/Services.macos.tsrx` is also an existing service harness. There
is no Windows-specific sign-in example to qualify. The audit selected the
mobile secure-storage plugin on Windows. A new Windows root export condition
and leaf now avoid that import and use the OS PasswordVault API, without adding
dependencies. Package/typegen manifests include the dedicated root; public
Service<SecureStore> types remain shared.

The leaf requires actual package identity and uses package family in its resource
namespace; it reports unsupported without identity or credential classes.
Availability constructs the vault but does not promise access policy success.
Keys and values are JSON strings internally so empty strings and control
characters survive WinRT's nonempty credential fields. A missing item returns
null and removal of an absent key succeeds. Other reads reject with the fixed
message `Credential Locker read failed`; writes/removals return false. Native
error text, keys and values are never forwarded or logged. A read-only probe of
a fresh absent task key found Error.message ending in `(HRESULT 0x80070490)` and
no numeric code/hresult field; the leaf recognizes only that missing-item suffix.
Unexpected failures do not masquerade as absence. This is alpha.144-specific
bridge evidence, not a general WinRT error-serialization guarantee.

The same existing x64 DLL passed actual PasswordVault operations in isolated
short-lived processes: missing get/remove, overwrites, empty keys and values,
Unicode/NUL/CRLF strings, two separate resource namespaces, and named removal.
The final probe removed every created test entry in a finally block and verified
all were absent, printing only roundtrip/cleanup status markers. It did not
retrieve or enumerate unrelated vault entries. Log:
`research/windows61/windy-native-vault.log`, exit 0. The earlier read-only error
shape log is `research/windows61/windy-native-vault-projection.log`.

The probe substitutes fresh task family names for Package.Current identity;
credential classes and all vault operations are actual WinRT projections.
Consequently real packaged identity, cross-launch persistence, account roaming,
locked/access-policy failures and production import/app integration remain
unqualified. Package family prevents accidental resource collisions, not access
by other desktop apps. Microsoft's [PasswordVault contract](https://learn.microsoft.com/en-us/uwp/api/windows.security.credentials.passwordvault)
allows regular desktop apps to access other user lockers; [Credential Locker](https://learn.microsoft.com/en-us/windows/apps/develop/security/credential-locker)
can roam entries under Windows/account policy. The 20-entry limit applies to
AppContainer apps per the [Add contract](https://learn.microsoft.com/en-us/uwp/api/windows.security.credentials.passwordvault.add).
No local-only or isolation guarantee is added by this adapter.

Five mocked Windows regressions passed in the existing isolated Turbo fixture
(25 focused tests total, exit 0), covering Node's Windows export resolution,
unavailable hosts, string/replacement/missing semantics, package namespaces,
malformed values and sanitized failures. No mobile module is allowed to load in
the adapter fixture. These are mocked host contracts, except that the root-path
assertion invokes Node's actual conditional resolver. Log:
`research/windows61/windy-vault-contracts.log`. Native probes inline the leaf
and a minimal UnavailabilityError after removing imports; they do not exercise
production bundling. The task-owned `native-vault-probe.ps1` remains beside the
other windy runners and can be repeated under the device reservation:

```sh
goddard-agent resource run --json '{"resources":{"exclusive":["device:windy"]},"purpose":"Focused Windows credential probe"}' -- ssh windy 'powershell -NoProfile -File C:/Users/alecs/dev/octane-windows61-checks-88a67da/native-vault-probe.ps1'
```

Full maintained package checks remain deferred, including:

```sh
pnpm exec turbo run test:windows --filter=@octane-xplat/secure-storage
pnpm exec turbo run test:packed --filter=@octane-xplat/secure-storage
pnpm exec turbo run typecheck --filter=...@octane-xplat/secure-storage
```

A Turbo dry run also resolved only secure-storage#test:windows with no
dependency tasks; the dry run executed no tests. The focused task is now included in
this package's existing packed-test script. No native build, install, app launch,
package registration or visual work ran. Public guide, package README, service
skill and release note describe the subset. The passkey-sign-in recipe excludes
Windows, and hosted auth remains unavailable; this does not qualify that workflow
or add a Windows recipe target. No shared audit snapshot was regenerated and no
evidence-gated issue row is closed.

## Windows UI declaration entrypoint reconciliation

The Windows root package export added by the import foundation work was missing
from the UI declaration target's explicit runtime/types lists. Both Windows paths
are now declared alongside the existing variants. The TypeScript project's
`src/*.ts` include already includes index.windows.ts, and the shared public
exports remain unchanged. This reconciles the maintained manifest; it does not
prove declaration generation or the package consumer graph. UI typegen,
pack-check, dependent checks and native app verification remain deferred:

```sh
pnpm exec turbo run typegen --filter=@octane-xplat/ui
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
```

A targeted JSON parse/path comparison checked that the Windows runtime/types
paths match package.json and that the source entry exists. No broad generation
or new test suite ran for this manifest-only change.

## Windows controlled-text selection candidate

The common text-write helper preserved only Android selections; Windows reached
the plain write path. Pinned core `abae298` assigns TextBox.Text without selection
restoration in TextBase._setNativeText. This is source evidence of missing
preservation, **not** an OS reproduction of a cursor jump. The form example
`apps/astryx-sandbox/src/examples/dialog/DialogFormDialog.tsrx` controls both
TextInput and TextArea values; SearchInput, date/time inputs and composer paths
also call this helper. Assume ordinary mid-string editing deserves priority
over specialist integrations. Existing examples already use the shared API and
need no source change; they are not Windows runtime passes.

A Windows-only text-write leaf now snapshots SelectionStart/SelectionLength and
calls TextBox.Select after changed controlled writes. It clips the range after
shrink, skips unchanged values, retains synchronous echo suppression through
nested writes, and avoids restoring an old selection after native identity or
text was changed reentrantly. Secure/absent/invalid selection surfaces take the
plain guarded write path. Selection restoration failure does not discard an
accepted value; text setter failures still propagate and clear the guard.
Public exports and signatures match the default leaf. No shared component,
renderer, core patch, lockfile or external dependency changed. API reference:
[WinUI TextBox.Select](https://learn.microsoft.com/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.controls.textbox.select)
and [SelectionStart](https://learn.microsoft.com/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.controls.textbox.selectionstart).

Six projected-host regressions passed on windy through the existing isolated
Turbo fixture: range/caret retention and echo suppression; shrink/UTF-16 bounds;
secure/missing/invalid surfaces; write/selection failures; native replacement;
and nested writes preserving the latest value. The full focused fixture passed
31 mocked contracts, exit 0. Log:
`research/windows61/windy-text-write-contracts.log`. These evaluate transpiled
source against a fake TextBox whose write resets selection; they do not execute
a real WinUI TextBox, import the production UI root or transform hooks. No native
UI process, OS keyboard input, screenshots or build was used for this batch.

The maintained native UI task includes the new regression. Targeted lint,
format, syntax and whitespace checks passed. UI typegen, native suite,
package/dependent checks and Windows app verification remain deferred at the
exact commands above. Real selection projection/lifecycle, IME, secure input,
OS focus and form/modal keyboard behavior remain unqualified. Keyboard bridging
still needs shared core native-event ownership (TextField already owns a KeyDown
subscription for submit); this helper does not supply that bridge or close the
focus/keyboard checklist. The form/overlay recipe exclusions remain unchanged.
This fixes an unreleased Windows candidate, so no additional release note was
added. Public Windows guidance and the primitives skill record the boundary.

## Windows raw key-event prerequisite

The pinned Windows View had no keyDown/keyUp notification bridge. The driver
maps onKeyDown to keyDown, while TextField already owns a native KeyDown
subscription for submit. The preview-core patch now adds a dedicated raw key
module and Windows View lifecycle calls, reusing the shared event subscriber.
Each channel attaches only while loaded and observed. Removing one leaves the
other and TextField's submit owner intact. Unload/dispose/native replacement
retire callbacks; late callbacks, disabled targets and stale identities do not
forward. Once-handler removal is reconciled after Observable.notify returns.
Cleanup tries every owned channel, and base unload/dispose still runs if detach
fails. Retained source and published-file integration delta:
[windows-keyboard](../../patches/windows-keyboard/README.md).

```ts
// Windows-native core event shape; this is not the portable UI KeyboardEvent.
view.on('keyDown', (event) => {
  if (event.nativeEvent.Key === Windows.System.VirtualKey.Enter) event.preventDefault()
})
```

Subscriber priority makes raw callbacks run before submit in either registration
order. Ordinary pointer/input subscribers retain priority zero and their prior
relative order. A weak event marker records only explicit consumption by this
bridge; TextField consumes that marker before raising returnPress. A native
Handled flag by itself does not alter the earlier submit behavior. This also
allows a once-handler to consume Return after Observable removes it. Portable
key naming/code/modifier/composition normalization is still missing, so the
public useKeyboard hook deliberately remains unsupported on Windows. Raw core
notification is a prerequisite, not qualified menu/dialog keyboard support.

Twelve new mocked key regressions and all 19 retained pointer regressions passed
on windy in an isolated Turbo task (31 total, exit 0). They cover both key
channels, independent removal, submit sharing, registration order/cancellation,
prehandled legacy behavior, once-handlers, disable, unload/reload/replacement,
disposal during dispatch, failed registration rollback and cleanup failures.
The key suite evaluates the actual published helper and extracts the affected
View/TextField methods with TypeScript's parser into a fake base. It does not
instantiate the full class, NativeScript renderer, WinUI controls or WinRT event
projection. The pointer suite reads the unchanged gesture body plus the updated
subscriber. Log: `research/windows61/windy-keyboard-pointer-contracts.log`.
Earlier 8/10-case runs are superseded by the final combined result.

The canonical patch's seven affected Windows targets were reverse/reapplied
against copied exact published preimages, whose original blob hashes matched
the prior canonical patch; the result matches the tested
candidate byte for byte. Every other patch section was compared byte for byte
and is unchanged. To respect the no-install boundary, no pnpm patch/patch-commit
or dependency install ran: targeted published-file diffs were generated from
those private copies. The authored helper was syntax-transpiled to ES2021, not
built with the package. The generated patch-package copy, manifest explanation,
workspace metadata and lockfile hash are synchronized; pnpm check:patches passed.
The lockfile changes only substitute the preview-core patch hash. Final SHA-256:
`f6bf77c513902a1106ad9d22f8efe024c80f0ae0a5bc3ab6e3e5fec643ef82e2`.
Installed dependencies and the Windows app still have the earlier patch.

The new focused task has no build dependencies (confirmed by Turbo dry run), is
uncached, and accepts WINDOWS_CORE_ARTIFACT for private candidate files. The
retained pointer test accepts the same override. The task-owned remote fixture
is `C:\Users\alecs\dev\octane-windows61-checks-88a67da\core-keyboard`; its Turbo
task is test:keys. The maintained default task and frozen adoption are deferred:

```sh
pnpm install --frozen-lockfile
pnpm exec turbo run test:keyboard --filter=@xplat/windows
pnpm exec turbo run typecheck --filter=...@octane-xplat/cli
pnpm exec turbo run typecheck --filter=...@octane-xplat/patches
pnpm exec turbo run typecheck --filter=...@xplat/windows
pnpm exec turbo run build:windows --filter=@xplat/windows
```

After authorized adoption/build, qualify real KeyDown/KeyUp projection, repeated
keys, consumed Return, modifier/IME handling, secure replacement, focus/window
transitions and event teardown in the packaged app. No install/build, OS input,
UIA, screenshot or app launch ran for this batch. Existing shared forms and
menus are the demand assumption; key-bridge prerequisites take priority over
niche integrations. The keyboard-clipboard/shared-overlays recipes still exclude
Windows, and no acceptance criterion or issue checkbox was closed. This is an
internal prerequisite for an unreleased Windows API, so no release note was
added. The primitives skill warns against advertising portable support early.

## Windows floating-layer backend selection

Windows previously resolved useLayer to use-layer.tsrx, which requires the
AppKit showLayer bridge. The NativeScript implementation was only available in
the mobile leaf, excluded from the Windows suffix chain. The new Windows leaf
adopts that existing implementation: anchored presentation uses Popover, while
fixed/custom surfaces use the declaring RootLayout and native portal. At commit
`4809eba88`, its body matched the retained mobile implementation exactly except
for its platform comment; public exports and signatures match. The focus-return
work below adds an explicit Windows host getter. No new engine/dependency or
AppKit bridge emulation was added. Mobile and AppKit source files are unchanged.

`apps/astryx-sandbox/src/examples/layer/LayerHookUsage.tsrx` supplies the concrete
demand: a trigger ref, show/hide and an anchored layer body. Assume this basic
popup flow matters before specialist integrations. It already uses the shared
API, so no example edit is needed. Its Windows runtime behavior is not qualified.

A minimal Vite resolver diagnostic passed seven path checks plus a body
comparison (exit 0): Windows selects use-layer.windows.tsrx; iOS and Android
retain use-layer.mobile.tsrx; Windows resolves Popover, root-layout, native-portal
and platformProps to their existing NativeScript defaults. The extension arrays
were evaluated from the actual CLI nativePlatformExtensions function with an
explicit target. Vite's resolver came from the existing UI toolchain, with
config-file loading disabled. No server, browser, dependency scan, transform,
full preset/import graph or UI was started. Log:
`research/windows61/layer-backend-resolution.log`.

Targeted TSRX formatting/lint, unchanged-body comparison, UI web-barrel check and
whitespace checks passed. No new low-impact mirror test was added for the source
adoption. Existing use-layer.mobile object-driver tests and full Windows
transform/declaration/import/app checks remain deferred with the UI commands
above; the minimal resolver is not production evidence. RootLayout ownership,
geometry, RTL/resize, controlled/context updates, nested dismissal, keyboard/IME
and focus still require Windows checks. No recipe target or evidence-gated
checkbox was closed. The Windows guide and primitives skill state the boundary.

A neutral shared extraction was investigated, but lint requires a supported
renderer boundary and the AppKit default has separate ownership. The final
change is a Windows-specific leaf. No lint rule was weakened and no inactive
placeholder sibling was introduced. Keep the two NativeScript implementations
aligned when their common logic changes. This is an unreleased Windows backend
repair, so no additional release note was added.

## Windows layer focus-return candidate

The Windows suffix chain also selected the default AppKit layer-keys helper.
A dedicated Windows leaf now captures the declaring XamlRoot's focused control
and returns a best-effort restore callback. The existing dismissal stack calls
it only for the retiring top layer when restoration is enabled. The helper
owns no listeners or subscriptions, so skipped restoration needs no cleanup.

Popover passes its anchor as getHost; the Windows fixed-layer backend passes
its declaring sentinel. These are ownership inputs already used by dialogs and
sheets, not a new public API. An explicitly supplied but unattached host never
falls back to the primary window. Without a host, the explicit target's root or
Application root can provide the owner. The latest explicit target is read at
restore time and may be a NativeScript view or a public handle containing it.

Restoration requires a visible root, an Activated InputActivationListener for
that root's AppWindowId, and an attached/enabled control still in the same root.
A host moved to another root, foreign target, retired projection or missing
activation/focus API skips restoration. The helper calls Focus(Programmatic);
it never calls a window-activation API. It does not read text or credentials.
See Microsoft's [root-scoped focus lookup](https://learn.microsoft.com/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.input.focusmanager.getfocusedelement?view=windows-app-sdk-1.8)
and [activation listener](https://learn.microsoft.com/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.input.inputactivationlistener?view=windows-app-sdk-1.8).
Use the explicit metadata name GetFocusedElementWithRoot: relying on generic
overload dispatch risks the zero-argument lookup on older projections. Its
presence, XamlRoot proxy identity and InputActivationListener behavior still
need qualification in the pinned native host; missing APIs fail closed.

Nine maintained mocked contracts passed on windy through a new isolated Turbo
test:focus task, exit 0. Its dry run has one task and no dependency builds.
They cover root capture, latest view/handle targets, absent hosts versus
unattached hosts, hidden/inactive windows, foreign/moved roots, unloaded/disabled
controls, missing APIs and throwing proxies/getters. The Windows source is
transpiled and executed against mocked imports; no actual FocusManager, native
control, window, OS input, UIA or renderer ran. Log:
`research/windows61/windy-layer-focus-contracts.log`.

The minimal resolver diagnostic also selects layer-keys.windows.ts and confirms
that the Windows layer backend differs from mobile only in its platform comment
and declaring-host getter (eight path checks plus comparison, exit 0). Log:
`research/windows61/layer-focus-resolution.log`. Targeted formatting/lint, UI
barrel synchronization, recipe structure and whitespace checks passed.

The test is registered in UI test:native. The full suite, package/dependent
typechecks, Windows build and app checks remain deferred at the commands above.
After authorized native adoption, check ordinary and nested close, explicit
finalFocusRef replacement, removed/disabled controls, owner-window changes,
inactive/secondary windows and no foreground activation. Initial focus, Tab
containment/background exclusion, Escape, IME and production overlay behavior
remain separate gaps. This is an unreleased Windows fix; no new release note or
supported recipe target was added. No evidence-gated issue checkbox was closed.

## Windows headless scroll observation

The basic ScrollableArea component already resolves to Mason's scroll shell;
the existing Windows offset helper uses its scrollTo surface. No substitute
ScrollViewer engine was added. Demand assumptions come from the six-row notes
viewport in ScrollableAreaShowcase and the shared 24-row ScrollBoxDemo. Their
source is unchanged and is not a Windows runtime pass.

The default headless hook measured scroll and viewport layout, but its content
getter only forwarded a ref. Source inspection found no content-layout
subscription, so content growth without viewport resize could leave edge state
stale until another observed event. This is a source gap, not a new OS-level
reproduction. A Windows-only hook now composes scroll, viewport/content layout,
and load/unload props through the existing native driver event path, following
the retained AppKit observer pattern without changing its files.

The leaf samples Mason's scroll/client sizes and offsets in layout units,
normalizes non-finite geometry and uses the shared clamped edge-state helpers.
It updates the snapshot before forwarding caller callbacks and avoids redundant
state writes. Refs and caller props are preserved; callbacks read the latest
options. Foreign retired-host events are skipped. Detached/unloaded or failed
geometry resets to a neutral edge state; a later load remeasures. It owns no
manual listeners. Axis filters state; caller dimensions/orientation still
configure scrolling. Keyboard access, overscroll chaining and sticky
containment remain inert; logical/RTL behavior is not newly qualified.

Eight maintained source-logic contracts passed on windy through isolated Turbo
test:scroll, exit 0. Its dry run contains one uncached task with no dependencies.
The tests cover growth/shrink without viewport resize, callback timing and
composition, latest axis/handlers, nested refs, invalid/sub-unit ranges,
overscroll clamping, replacement/detach, unchanged-state coalescing, unmount,
late load and reload. They transpile the actual source and its shared state/ref
helpers, with scripted hook slots and fake view metrics. They do not run the
Octane compiler/renderer, Mason engine, native events or any OS input. Log:
`research/windows61/windy-scrollable-area-contracts.log`.

The regression is registered in UI test:native. A minimal resolver diagnostic
passed five paths: Windows selects its dedicated hook and shared state/ref
helpers; iOS/Android retain their default hook. An AST comparison confirms
matching public generic parameters, arguments and result type. Log:
`research/windows61/scroll-observer-resolution.log`, exit 0. Targeted lint/format,
barrel/recipe and whitespace checks passed. Full UI and
dependent checks, native build/app and package gates remain deferred at the
commands above. Native qualification must check actual content-only growth,
resize, edge notifications, callbacks and renderer updates, retention/reload,
wheel/touch/keyboard scrolling, both axes, RTL, zoom/scaling and teardown. The
Windows guide and primitives skill state the current subset. Existing
platform-leaves/shared-overlays/keyboard-clipboard recipes still exclude
Windows; no criterion, audit snapshot or evidence-gated checkbox was changed.
This is an unreleased Windows hook repair, so no new release note was added.

## Windows picker host prerequisite review

The existing generated test project on windy references
Microsoft.WindowsAppSDK 1.6.250205002. This was a read-only project-file check,
not a regenerated current project or runtime picker test. The inspected
NativeScript Windows source template also names that version, but its source
cache is not proof of the installed binary's internals.

Microsoft's [current picker guide](https://learn.microsoft.com/en-us/windows/apps/develop/files/using-file-folder-pickers)
requires App SDK 1.8 or later for Microsoft.Windows.Storage.Pickers. Its
WindowId constructor cannot be assumed present in this existing 1.6 artifact.
The older Windows.Storage.Pickers classes require the actual owner's HWND via
[IInitializeWithWindow](https://learn.microsoft.com/en-us/windows/apps/develop/ui/display-ui-objects).
Constructor-time console-window association in inspected runtime source does
not establish correct WinUI owner/modality or multi-window behavior; it was not
verified against the pinned DLL. No qualified owner-initialization bridge is
available in this task's evidence yet.

Therefore pick/pickMultiple and user-directed export retain their explicit
unavailable results. No SDK/package upgrade, install, host change, picker launch
or OS automation was performed. The existing FileInputDemo asks for image/* and
PDF attachments; that remains the demand assumption. Opening a legacy picker
without its owner or adopting a newer namespace without its SDK would not
complete that workflow. After authorized host work, qualify single/multiple
selection, filters, cancellation versus failure, window ownership, read/retain
of selected paths and absence of deletion of external files before enabling it.

## Windows app metadata candidate

The native default app-info module imports the iOS subpath and returns
unsupported outside Android/iOS. A Windows leaf now avoids that foreign import
and reads Package.Current.Id lazily. bundleId is Id.Name, version retains all
Major.Minor.Build.Revision components, and build is the literal Build field.
Unpackaged/missing hosts return unsupported/null metadata. Usable identity can
remain available when its version fields are absent, invalid or unprojected;
those fields stay null. Reads are not cached across startup failures.

The existing Services.tsrx readout displays appInfo.supported/version/build/
bundleId. That is the concrete demand assumption for About/support metadata;
it needs no example workaround. It was reviewed as source, not run on Windows.
The shared AppInfo type and public import paths are unchanged. Microsoft's
[Package.Current contract](https://learn.microsoft.com/uwp/api/windows.applicationmodel.package.current)
requires package identity; its [PackageVersion fields](https://learn.microsoft.com/en-us/uwp/api/windows.applicationmodel.packageversion)
provide the four numbers. There is no fallback to CLI settings, browser host
metadata, assembly versions or mobile APIs.

Four projected-host contracts passed on windy through the isolated uncached
Turbo test:app-info task (one task, no dependency builds, exit 0). They cover
lazy startup/retry, exact names and version components including zeros,
unavailable/error hosts and partially usable metadata. A minimal Vite resolver
using the current CLI extension function and package manifest passed nine
root/subpath/relative-path checks across Windows/iOS/Android; an AST comparison
confirms the same AppInfo annotation and four getters. No server, full preset,
production import graph, dependency scan or transform ran. Logs:
`research/windows61/windy-app-info-contracts.log` and
`research/windows61/windy-app-info-resolution.log`.

A resource-reserved standalone x64 native DLL check passed the unpackaged
unavailable contract, exit 0. Win32 GetCurrentPackageFullName independently
confirmed APPMODEL_ERROR_NO_PACKAGE (15700). The actual preview projects
Package.Current as undefined in this host; the adapter returned false and all
null fields. An initial diagnostic expected a propagated WinRT no-package
HRESULT and stopped before adapter assertions when that assumption was not
met. The final check verifies process identity independently and preserves the
adapter's required false/null assertions. These are unavailable-host results,
not packaged metadata evidence. The DLL remains alpha.144 with SHA256
748D95864AC032DE2D1BB69FEC1E5B2CDD393BAA1671E349AA670160AA66D47C. Logs:
`research/windows61/windy-native-app-info.log` (initial diagnostic failure) and
`research/windows61/windy-native-app-info-unpackaged.log` (pass). No app or UI
was launched, no package identity was fabricated, and metadata values were not
logged.

The existing windy formatter 0.1.0 formatted the two source/test files. Current
0.1.1 formatting and targeted lint could not start from the shared local
installation: @alloc/cmd-ts and picomatch were missing. No dependency install or
shared repair was performed. The local changelog check also could not start
because this worktree lacks yaml. The same current checker and all 14 pending
source notes passed in a private windy snapshot using existing dependencies,
exit 0. The first transfer included macOS AppleDouble files and failed; the
final archive contains every actual source note and no generated transfer
metadata. Logs: `research/windows61/windy-app-info-notes-check.log` and
`research/windows61/windy-app-info-notes-source-check.log`. Recipe structure
passed. The canonical changelog check subsequently passed (see connectivity
follow-up below). Exact remaining commands in the canonical workspace:

```sh
pnpm exec turbo run test --filter=@octane-xplat/platform
pnpm exec turbo run typecheck --filter=...@octane-xplat/platform
pnpm exec turbo run typegen --filter=@octane-xplat/platform
pnpm exec turbo run pack:check --filter=@octane-xplat/platform
pnpm exec turbo run test:packed --filter=@octane-xplat/platform
pnpm exec turbo run build --filter=@xplat/docs
```

Native packaged names, all version-field projections, app startup/integration,
architecture coverage, current declaration/packaged-consumer behavior and
Windows builds remain unqualified/deferred. A release note, service guide and
agent guidance record the subset. The platform-leaves recipe still excludes
Windows; no supported recipe target, shared audit snapshot or evidence-gated
checkbox changed. Hosted auth and deep-link activation remain separate gaps.

## Native connectivity ownership and Windows bridge checks

The existing core Windows connectivity implementation was inspected before
replacing it. Its actual read, NetworkStatusChanged registration and removal
passed in the resource-reserved alpha.144 x64 DLL, exit 0. A second check
matched its sampled connection classification against managed WinRT and checked
that a connected reference profile was not returned as none. No network
connection was changed or status-change delivery forced. The module body was
transpiled from installed core 9.1.4-next.0, SHA256
36e50258bca3bed7a7bde8d44c0cfeede63074158cd52786aa572789ce553a77.
The host supplied an identity zonedCallback shim; this did not import the full
NativeScript application. The DLL hash is unchanged from the earlier probes.
Logs: `research/windows61/windy-native-connectivity-core.log` and
`research/windows61/windy-native-connectivity-reference.log`. These checks do
not qualify app integration, event delivery, every adapter type or reconnect.
The one-argument asDelegate form works here; no core delegate patch was needed.

Before reusing that backend for Windows queries, seven lifecycle regressions
all failed against the retained previous platform connectivity source. They
now pass against the repair in the isolated windy Turbo test:network-owner
fixture, exit 0, one uncached task and no dependency builds. The tests run the
actual TypeScript module with a fake NativeScript Connectivity object. Each
registration owns its callback even when callbacks repeat; failed initial
reads/callbacks and partial native startup roll back. Dispatch skips removed
callbacks and does not deliver an extra initial event to newly added readers.
Reentrant startup shares one monitor; teardown is idempotent. A failed rollback
preserves the original startup error. Log:
`research/windows61/windy-connectivity-lifecycle-contracts.log` (expected
baseline failures and final seven-pass run kept together).

This repair changes the shared NativeScript default used by iOS/Android and
Windows; separate AppKit/browser leaves are unchanged. The initial module
shipped in stable tags containing b24fdf3 (including v0.10.0), so a fix note was
added. Public docs and service guidance show independent teardown. Recipes
retain their existing target scope. NativeScript iOS/Android and real Windows
subscription/transition behavior, full platform/dependent tests/typechecks,
consumer/declaration checks and app builds remain deferred at the existing
commands; this is not a Windows workflow qualification.

The shared local tooling dependencies are available again. Current formatter
and targeted lint checks now pass for the changed connectivity/environment
files and tests, plus the earlier Windows app-info source/test. Earlier
missing-dependency attempts remain recorded; the app-info formatter/lint debt
is cleared. Recipe structure and whitespace checks passed. No dependency
install or shared installation repair was performed by this task.

## Windows connectivity and default query environment

The Windows environment manifest selected the browser implementation and its
browser declarations, even though query-cache.ts imports this entry by default.
It now selects the native environment and native declarations. The concrete
demand is the maintained shared-query-data.ts session workflow and the Services
network readout. Assume server-backed lists, reconnect and background polling
matter before niche integrations. Services now displays an unavailable binding
as network unknown, rather than offline; no app render was run.

The published core profile parser returns none for unrecognized adapters. This
is source evidence, not a reproduced unknown-adapter OS failure. The Windows
leaf keeps the proven core status-change channel but supplies a fresh WinRT
profile-level reader. Missing profiles/None are known offline; local, constrained
and internet access permit work independently of the transport label. Only
recognized Wi-Fi, mobile and Ethernet are labeled; unknown transports remain
online when connected. Missing/malformed/throwing projection reports supported
false, which the environment maps to online undefined so queries may run. The
reader does not claim HTTP reachability. Microsoft's
[connection-level contract](https://learn.microsoft.com/en-us/uwp/api/windows.networking.connectivity.networkconnectivitylevel)
and [profile contract](https://learn.microsoft.com/en-us/uwp/api/windows.networking.connectivity.networkinformation.getinternetconnectionprofile)
support those distinctions.

The repaired subscription ownership is extracted into a small dependency-free
helper shared by the default and Windows leaves. NativeScript imports remain
inside those leaves; separate browser/AppKit implementations are unchanged.
An unavailable initial Windows binding publishes its unknown snapshot without
attaching the core monitor. Native environment teardown now suppresses queued
callbacks, remains idempotent and removes app listeners even if network teardown
throws. Windows Application source derives suspension from window visibility;
this is not per-window keyboard activation. No lifecycle policy was changed.

The final isolated windy Turbo test:windows-network task passed all 17 contracts,
exit 0: seven generic subscription ownership, four Windows SDK-state groups and
six Windows environment composition/resolution groups. Actual source modules
run with fake Core/WinRT objects. Node condition resolution checks actual
manifest paths for Windows runtime/types and unchanged web/macOS/iOS selection;
it does not load generated declarations. The task is uncached, with one task
and no dependency builds. Log:
`research/windows61/windy-windows-network-contracts-final.log`. Before the
teardown guard, two of the original five environment contracts failed; the
retained baseline/candidate log is
`research/windows61/windy-environment-contracts.log`.

A resource-reserved standalone alpha.144 x64 DLL check ran the actual Windows
reader body after type stripping/import substitution and matched supported,
online and transport against a separately sampled managed WinRT reference,
exit 0. No identity/network details were logged. DLL SHA256 remains
748D95864AC032DE2D1BB69FEC1E5B2CDD393BAA1671E349AA670160AA66D47C.
Log: `research/windows61/windy-native-connectivity-state.log`. This verifies
one sampled native state, not every connectivity level/adapter. No network
change, HTTP request, app bootstrap, query execution or native lifecycle event
was performed. Core status-change delivery still needs qualification.

Current targeted formatting/lint and whitespace checks passed. Recipe structure
passed; canonical release-note validation passed all 16 notes using a temporary
link to existing yaml, removed immediately afterward. No install or dependency
repair occurred. This also clears the earlier app-info local changelog debt.
Public services/query guidance, agent guidance, a release note and the maintained
Services example distinguish unknown state and experimental Windows support.
Reviewed recipes keep their existing targets; Windows coverage/verification was
not inserted into another target or inferred from these contracts. Shared audit
snapshots and issue checkboxes are unchanged.

Full package/dependent tests, declarations, packed consumers, native app and docs
builds remain deferred. Relevant exact commands, including the touched example:

```sh
pnpm exec turbo run test --filter=@octane-xplat/platform
pnpm exec turbo run typecheck --filter=...@octane-xplat/platform
pnpm exec turbo run typegen --filter=@octane-xplat/platform
pnpm exec turbo run pack:check --filter=@octane-xplat/platform
pnpm exec turbo run test:packed --filter=@octane-xplat/platform
pnpm exec turbo run test --filter=@octane-xplat/ui
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run typecheck --filter=...@xplat/app
pnpm exec turbo run build --filter=@xplat/docs
pnpm exec turbo run build:windows --filter=@xplat/windows
```

Real reconnect/disconnect delivery, suspend/resume across multiple windows,
query pausing/refetch/polling in a Windows app, packed source resolution, all
architectures and native dependency patch compatibility remain unqualified.

## Windows keep-awake candidate

The existing Windows leaf returned false for every operation. It now uses
Windows.System.Display.DisplayRequest with one owned request shared by a
set of independent tags. The maintained examples/keep-awake/ReadingScreen.tsrx
supplies the concrete reading/presentation demand; its shared hook and source
are unchanged. This everyday capability follows the earlier common-flow/input
prerequisites; actual keyboard/focus/overlay qualification still requires the
deferred core adoption and app checks. No new engine, dependency or permission
was added, and AppKit/GTK/mobile leaves are unchanged.

Creation, RequestActive and RequestRelease run through the core's direct
Utils.dispatchToMainThread channel and a serialized operation queue. This avoids
relying on the core isMainThread heuristic, whose missing-queue fallback is true.
The published core 9.1.4-next.0 Windows helper forwards dispatch to
__nsRunOnUIThread; source SHA256
0F4FE51C9FFAB4881670DAA0142CD2F9DAE53D287FEAC747D463EAC485CBA527.
Log: research/windows61/windy-core-mainthread-helper-source.log. This is source
inspection of the available published artifact, not proof of actual app-thread
execution. The same installed application source emits exit after its last
registered window closes or on the host Exit notification, rather than every
window close (research/windows61/windy-core-application-exit-source.log).
Microsoft's [DisplayRequest contract](https://learn.microsoft.com/en-us/uwp/api/windows.system.display.displayrequest)
identifies the object as non-agile and requires matched release calls.

Duplicate tags do not multiply native requests. Background activation accepts
ownership while isActivated remains false; suspension releases the held object,
resume retries requested tags, and exit releases all owners. Failed release
retains the request for cleanup retry. Failed resume can retry the existing tag
rather than treating it as already held. Listeners detach on final cleanup and
partial setup failure; retired lifecycle callbacks remain inert even after a
new ownership cycle starts. The shared type comment now includes background
deferral; exported types, names and method signatures are unchanged.

The isolated windy Turbo test:windows-keep-awake task passed 12 contracts,
exit 0: 11 new Windows ownership/lifecycle/failure/serialization groups and the
existing macOS tag-set regression containing the Windows unavailable-host check.
The latter now supplies missing-host import mocks to the implemented Windows
leaf. Other tests in that file were filtered out, not run. The dry task has one
uncached task and no dependency builds. Source executes with mocked Core/WinRT
and a controlled UI-dispatch queue; it does not prove OS thread affinity,
activity, power grants or lifecycle delivery. Log:
`research/windows61/windy-keep-awake-contracts-final.log`.

A resource-reserved standalone alpha.144 x64 DLL check constructed DisplayRequest
and verified RequestActive/RequestRelease method projection, exit 0. It did not
call either method, create a power request, launch UI, change timeout settings or
wait for sleep. DLL SHA256 remains
748D95864AC032DE2D1BB69FEC1E5B2CDD393BAA1671E349AA670160AA66D47C.
Log: `research/windows61/windy-native-keep-awake-construction.log`.

Targeted current formatter/lint, whitespace and recipe structure passed.
Canonical release-note validation passed all 17 notes using the temporary link
to existing yaml, removed after the check. Public keep-awake target limits,
agent services guidance and a release note describe the candidate and preserve
the physical-evidence boundary. The maintained reading-screen example already
uses the shared hook, so no platform workaround or example edit was needed.
Existing recipe scopes are unchanged; no Windows qualification was inserted
under another target, no shared audit snapshot was regenerated and no issue
checkbox was closed.

Exact deferred package/app checks remain:

```sh
pnpm exec turbo run test --filter=@octane-xplat/platform
pnpm exec turbo run typecheck --filter=...@octane-xplat/platform
pnpm exec turbo run typegen --filter=@octane-xplat/platform
pnpm exec turbo run pack:check --filter=@octane-xplat/platform
pnpm exec turbo run test:packed --filter=@octane-xplat/platform
pnpm exec turbo run build --filter=@xplat/docs
pnpm exec turbo run build:windows --filter=@xplat/windows
```

Native app UI-thread dispatch, successful grants/releases, multiple-window
suspend/resume, packaged/unpackaged hosts and architectures remain unqualified.
Physical display sleep prevention and ordinary sleep after final cleanup need
separate human-authorized power/lifecycle checks. Constructor/method presence
and fake dispatch do not close the keep-awake issue item.

## Authorized native qualification: adoption and first typecheck

The human approved the bounded native pass with "ok go": isolated dependency
adoption, Windows harness build, and nonvisual text/keyboard, modal focus/Escape
and scrolling checks. This permission supersedes the earlier deferral for that
phase only; no screenshot/image analysis is authorized.

The laptop's existing checkout has uncommitted Windows build work and was left
unchanged. A separate detached repository was materialized at
C:/Users/alecs/dev/win61-c905842a3 from local c905842a3 through a Git bundle,
using read-only object alternates to the existing repository. No branch, reset,
stash, push or merge occurred. Its app identifier is qualification-only
org.octanexplat.windows61, preserving the existing package and app data.
A frozen pnpm 11.24.0 install passed with lifecycle scripts disabled; required
generation subsequently ran through Turbo. Patch synchronization passed.
Log: research/windows61/windy-native-adopt.log.

The installed preview core now contains the canonical f6bf77c513902a1106ad9d22f8efe024c80f0ae0a5bc3ab6e3e5fec643ef82e2
repair. All 31 maintained keyboard/pointer regressions passed against those
installed files via Turbo test:keyboard, exit 0. This closes the earlier
installed-JavaScript adoption gap for that repair only; the tests still use
mocked native events and do not establish OS input, padding/Intl binary adoption
or app behavior. Log: research/windows61/windy-native-build.log.

The first standalone Windows typecheck failed with one TS2345: HumanQA passed
the expanded device.os union into a separate four-target QaTarget union.
QaTarget now derives from DeviceInfo['os']; existing per-check target arrays
are unchanged. The corrected standalone Windows typecheck passed in the retry:
37 of 38 executed Turbo tasks succeeded; the remaining task was the separate
native build. The latter failed its full kitchen-sink Vite boundary because
packages/audio/src/audio.ios.ts remained reachable. No app was produced or
launched by this attempt. Log: research/windows61/windy-native-build-retry1.log.

That build's upstream delegated checker still reported 12 foreign-root/context
errors across 11 files, including macOS focus-clock, Linux bridge imports,
Android Utils/AndroidApplication and web-host router type identity. It explicitly
continued under the existing configuration. The standalone pass is not a pass
for that delegated checker; no diagnostic policy was weakened.

## Windows build orchestration repair

The first release-build attempt reached the app's build script, which invoked
pnpm -w gen:app after the outer Turbo graph had already generated the app.
That nested Turbo process repeated declaration generation and ran tasks in
parallel despite the outer --concurrency=1 limit. The owned build process tree
was stopped before native compilation to avoid exhausting the 8 GB laptop;
that cancelled attempt is not a build pass (windy-native-build.log).

The Windows build script now starts ns build windows directly. Its existing
@xplat/app#gen prerequisite remains in apps/windows/turbo.json. The retry's
actual dry graph contains exactly one app-generation task ordered before the
Windows build. The live graph generated once, then entered NativeScript/Vite;
no second graph was spawned. The full build subsequently failed the real iOS
audio boundary described above. apps/windows/.gitignore now excludes the
generated platforms host, intermediates and binaries; the README gives the
Turbo release command. No package dependency or lockfile changed.

The isolated qualification checkout additionally places --release in its app
script to share one graph with standalone typecheck, and narrows only the root
submodule-helper hash inputs to its script, .gitmodules and vendor sources.
The helper still runs uncached and all dependency ordering is preserved; no
check or prerequisite is skipped. These are qualification-only metadata edits,
not local shared-Turbo changes. They prevent unrelated fixture/output churn
from repeatedly rebuilding all declaration prerequisites. Exact invocation:

```sh
pnpm exec turbo run typecheck build:windows --filter=@xplat/windows --concurrency=1 --continue=dependencies-successful
```

Current targeted format/lint, recipe structure and whitespace checks passed.
This repairs private harness orchestration; no supported public recipe target,
Windows rendering/input qualification, shared audit snapshot or issue checkbox
changed. The app's default synthetic self-test entry has not been launched.

## Windows audio import prerequisite

The full kitchen-sink build's actual boundary failure identified the native
audio wrapper's static iOS/Android imports. Its runtime platform checks do not
keep those modules out of the bundle. A Windows-only audio.windows.ts leaf
now preserves unavailable creation with an explicit Windows error, without
importing either mobile backend. No playback engine, API type, dependency,
mobile/AppKit leaf or supported capability was added.

A focused Vite build on windy passed the actual public @octane-xplat/audio
entry with the current CLI relative resolver and xplat-platform-boundary guard.
Its emitted modules contain audio.windows.ts and no iOS/Android leaf; executing
the emitted chunk confirms createAudioPlayer throws the Windows unavailable
error. No server, native runtime, audio device or playback ran. An initial
probe fixture incorrectly supplied a virtual library entry that Vite normalized
as a path; it failed before testing audio. The corrected probe uses an owned
physical entry and the actual app importer. Logs:
research/windows61/windy-native-common-build.log (fixture setup failure) and
research/windows61/windy-native-common-build-retry1.log (boundary assertion pass,
then ongoing bounded native build).

The package README and service skill retain the unsupported playback boundary.
Current targeted formatting/lint and whitespace checks passed. The original
kitchen-sink entry has not yet been rebuilt after this leaf; the next native
build selects the bounded public-UI common-flow case instead of the app's
camera/file-picker/synthetic-test timers. That case does not qualify the full
kitchen sink or optional services. No audio support checkbox or shared audit
snapshot changed; full audio typecheck/packed/consumer checks remain outstanding.

## Exact Windows projection mapping in the harness

The bounded common-flow build initially failed to load
packages/platform/src/windows, imported as @octane-xplat/platform/windows by
media-query-host.windows.ts. The harness's platform/* TypeScript path wildcard
bypassed the package's explicit export to src/types/windows.ts. An exact
Windows-only mapping now points at that actual projection module. With this
mapping, Vite successfully transformed 987 modules and emitted the bounded
Windows bundle; the build proceeded to dotnet-tool. This is bundle evidence,
not native compilation, launch or UI behavior. Log:
research/windows61/windy-resolver-retry2.log.

The temporary common-flow screen was moved from apps/windows/src into the
existing packages/app workspace, whose declared JSX dependency supplies its
native intrinsic types. That removed 23 fixture-context diagnostics. The
remaining fixture diagnostic identified an invalid raw scrollview height prop;
its corrected static CSS is prepared for the next build. The delegated checker
also retains the same 12 unrelated context diagnostics. The earlier retry setup
failed before building because PowerShell's process working directory differed
from Set-Location; the runner now passes an absolute path to ReadAllText.
These fixture failures are not platform capability results. The original
owned app entry remains backed up, and the normal kitchen-sink entry has not
been launched. The exact mapping affects the private Windows harness only;
no public recipe, supported target, shared audit snapshot or issue checkbox
changed. JSON parsed and whitespace checks passed; the repository formatter
reports JSON as unsupported rather than checking it.

## Native package payload qualification

The corrected bounded case passed its standalone Windows typecheck and native
release build: all 38 executed Turbo tasks succeeded (34 cache hits), exit 0,
using the same combined command above. The Vite delegated checker still reports
its 12 foreign/context diagnostics, so this is not a delegated-checker pass.
The fixture's raw scroll viewport now uses static CSS for its height instead
of the invalid intrinsic height prop. Log: research/windows61/windy-payload-retry.log.

The first native build had already produced an unsigned 23,668,180-byte MSIX,
but direct ZIP inspection found zero bridge, Widgets or Mason files and no
native activation registrations. The loose output contained the components.
Evidence: research/windows61/windy-baseline-package-payload.log and
windy-current-plugin-output.log. A successful compilation therefore did not
establish a launchable app. The owning artifacts are Windows runtime
0.1.0-alpha.144, preview core abae298, MasonKit 1.0.0-beta.126 and Windows App SDK
1.6.250205002; no pin has been upgraded.

The Windows app resource override now declares the bridge publish files and
active-architecture Widgets/Mason DLL + winmd pairs as package content before
output discovery. A second real MSIX includes all seven required files:
three dotnet-bridge files plus both component pairs
(research/windows61/windy-candidate-package-payload.log). The plugin registration
targets still run too late for that package's generated manifest. The candidate
now explicitly schedules those targets before merging their native server
registrations into the manifest actually packaged. The merge passed against
the actual source/generated manifest pair and was unchanged on a second run;
its build-order adjustment is still under qualification. No manual repack has
been substituted for validating the app resource hook. This is a local
workaround for these pinned build targets; recheck/remove it when upstream
includes the payload and registrations during package discovery/generation.
No GUI, OS input or screenshot ran in this build phase.

An attempted pnpm exec ns build windows --help unexpectedly triggered pnpm's
dependency-drift auto-install and the root postinstall's broad typegen graph.
It failed on the unrelated Sentry declaration generator before the bounded
cancellation commands could find its already-exited process. Neither
cancellation command killed any process. The install/generation failure is
not a check pass. Log: research/windows61/windy-build-help.log. The isolated
checkout now adds verify-deps-before-run=warn to its own .npmrc, preserving
drift warnings while preventing implicit installs on subsequent commands.
This follows pnpm's [documented dependency-check policy](https://github.com/pnpm/pnpm/blob/main/pnpm/docs/settings/build.md#verifydepsbeforerun).
No shared/global pnpm configuration changed. The next registration retry
reported no lockfile/workspace-config diff and patch synchronization passed;
all prerequisite tasks remain in the Turbo graph. Full package/dependent and
packed-consumer checks remain outstanding at the earlier commands; the
bounded Windows build authorization does not turn those into passes.

The integrated registration retry passed: all 37 native-build graph tasks
succeeded (35 cache hits), exit 0, 3m20.651s. The actual MSIX contains both
Widgets and Mason native activation servers as well as all seven required
payload files (research/windows61/windy-registration-retry.log and
windy-final-package-payload.log). The explicit dependency on the plugin's
registration targets is required: a merge scheduled only after manifest
generation ran before those targets and correctly had nothing to merge.
This packaging repair is qualified on the pinned x64 release build only.
ARM64, debug/unpackaged and actual view construction remain unqualified.
Existing duplicate FontManager NuGet references and missing symbol-packaging
tool warnings remain visible; no dependency version was changed.

Correction to the policy paragraph above: adding verify-deps-before-run=warn
in .npmrc did not establish effective policy. The first OS-phase wrapper's
installed-core recheck triggered another automatic install/root typegen before
signing or launching. The phase is being cancelled, and a retry must assert
the effective verifyDepsBeforeRun configuration before invoking pnpm exec.
This phase has no OS behavior result and must not be counted as an install,
launch, signing or keyboard pass. Log: research/windows61/windy-os-common-flows.log.

## Windows module identity and first launch

The repaired MSIX signed and verified with the existing CN=ui certificate and
installed successfully as org.octanexplat.windows61_8w7k1f04p0kxp. No certificate
trust was changed. Its first actual launch failed before a window was created:
Cannot redefine property: default:width while evaluating vendor.mjs. The
bounded driver therefore reported setup failure; no physical input, modal or
scroll scenario ran. The owned process was closed and the temporary interactive
scheduled task was removed. Log: research/windows61/windy-os-common-flows-retry.log.

The emitted bundle contained two identical core width registrations targeting
the same Style class. Their fingerprint matches the actual core source at
abae298, packages/core/ui/styling/style-properties.ts:295. Evidence:
research/windows61/windy-boot-registration-stack.log and
windy-core-style-duplicate-count.log. The relative resolver returned backslash
paths on Windows while other resolution paths used forward slashes. It now
normalizes returned module IDs to forward slashes. After this single resolver
change, the real native build passed all 38 tasks (32 cache hits), exit 0,
and the emitted width registration count fell from two to one. All four
maintained relative-resolution tests passed on the Windows filesystem,
including an assertion that returned IDs contain no backslashes. Logs:
research/windows61/windy-identity-retry2.log,
windy-identity-resolver-tests.log and windy-identity-native-task.log. The first
retry wrapper supplied an invalid Turbo output-logs value and failed before
building; it was corrected to errors-only. Native build output still retains
the delegated checker's foreign/context errors; that checker has not passed.

The isolated qualification checkout temporarily adds a test:resolver script
and Turbo task depending on the CLI build; the actual focused command is:

```sh
pnpm exec turbo run test:resolver build:windows --filter=@xplat/windows --concurrency=1 --output-logs=errors-only
```

This is a private verification alias, not a new published workflow. Current
targeted CLI source/test format, lint and whitespace checks passed. Full CLI
package/dependent typechecks and the rest of its suite remain outstanding:

```sh
pnpm exec turbo run typecheck --filter=...@octane-xplat/cli --concurrency=1
pnpm exec turbo run test --filter=@octane-xplat/cli --concurrency=1
```

The effective dependency policy is now set in the owned remote
pnpm-workspace.yaml as verifyDepsBeforeRun: warn and asserted through
pnpm config get before execution. The ineffective owned .npmrc line was
removed. The final policy inspection reports warn, an unchanged lockfile and
exactly that one added workspace setting
(research/windows61/windy-effective-dependency-policy.log). The cancelled first
OS wrapper exited 1 before signing/launch. After policy correction, the 31
installed-file keyboard/pointer regressions passed again without installing
anything; they remain mocked native-event tests, not OS evidence. The next
interactive phase uses the normalized bundle. Source/build qualification has
not been promoted to keyboard, modal or scrolling support.

## First real common-flow OS results

The owned package updated in place to version 1.0.0.1 with the normalized
bundle, preserving identity/publisher and app data. Reinstalling changed
contents at version 1.0.0.0 had correctly failed with 0x80073CFB; only the
isolated app resource metadata was incremented. The generated package filename
still contains 1.0.0.0, so the driver checks actual package identity and records
the installed version rather than inferring it from the filename.

Boot mvsoojim reached a real WinUI window. Actual OS checks passed for ordinary
physical typing (ordinary to ordinaryZ), exactly one controlled change callback,
Enter submit, raw Z key-down/key-up and Return key-up. Readonly typing was
rejected, and disabled/secure-readonly controls were disabled and rejected
focus. These are bounded x64 packaged-app observations, not portable useKeyboard
support, all key/IME behavior, all input variants or a whole-platform pass.

The same run failed dialog initial focus, Tab containment and Escape dismissal.
Because Escape did not close the dialog, explicit final-focus return was not
isolated. The fixture's file command channel never acknowledged blur, selection,
controlled-write, consumed-Return or cleanup requests; those checks are blocked
by the fixture and are not API failure diagnoses. Scrolling did not run after
cleanup failed. Multiline logs record first\r\rsecond after Enter and
first\rZ\rsecond after Z: a line break was inserted, but the original assertion
incorrectly required a document-end caret position. It is retained as a failed
scenario, with that assertion limitation, rather than retroactively counted
as passed. Logs: research/windows61/windy-os-version-retry.log and
windy-first-window-live-console.log. The earlier width-error lines in that
retained console belong to version 1.0.0.0 before the current boot's ready marker.

The revised temporary case uses a normalized Windows path and asynchronous
WinRT PathIO through NSWinRT.toPromise, removing core File.exists as a command
prerequisite. It records one comparison with core existence once async reading
works. The actual installed Windows file adapter uses synchronous done callbacks
for existence/readText; the inspected abae298 upstream source checkout has no
Windows leaf, so the installed artifact was inspected after opensrc could not
supply that file. This is an investigation lead, not a diagnosed filesystem bug.
The multiline assertion now checks added line breaks plus physical Z insertion,
without claiming document-end shortcut behavior. Scrolling uses its own OS
page-button click after cleanup. A plain SDK ContentDialog probe separately
checks native focus/Tab/Escape feasibility; it is not the framework Dialog.

The driver rejects ready records from before the current launch, using the
boot timestamp, and checks both foreground process and the actual process
under the pointer before clicks/wheel input. It reads only the owned package's
UIA/log data, never screenshots. The revised case's actual standalone typecheck
and native build passed all 38 tasks (34 cache hits), exit 0, 5m4.999s
(research/windows61/windy-common-v2-build.log). Its package version is 1.0.0.2;
OS results are pending. The normal kitchen-sink entry, visual parity, IME,
multiple-window and other architectures remain unqualified. No shared audit
snapshot, supported recipe or tracker checkbox changed.

## Common-flow case v2: nine bounded OS passes

The version 1.0.0.2 run (boot mvsp96ah) passed all six input scenarios: physical
typing/submit/raw keys; public isolated blur/focus; OS-selected range 2,2 retained
across a controlled value update; readonly/disabled/secure-readonly rejection;
multiline Enter plus Z; and consumed raw Return suppressing submit. Both the
component and headless scroll viewports advanced from offset 0 to 72 under
physical wheel input, with actual content height 816 and viewport height 160.
The hook reported block.isScrollable=true and atStart=false. These three scroll
assertions also passed. Logs: research/windows61/windy-os-common-v2.log and
windy-common-v2-full-console.log. This is nine bounded scenario passes, not an
all-green suite or portable useKeyboard support.

The normalized async command channel worked; its one comparison reported
coreExists=false while asyncRead=true for the same existing native path. That
confirms the original synchronous existence prerequisite is unusable in this
app context; the owning adapter/version and root cause need separate work.
The run also logged a dropped loaded-event transaction warning while navigating
to scrolling: A universal transaction cannot be aborted after its host batch
committed. Scroll assertions still passed. The warning remains visible and is
recorded as an expectation mismatch, not ignored or called a clean runtime.

Dialog still failed all three checks: initial focus stayed on Qualification
open dialog after the bounded wait, Tab escaped to Qualification input page,
and Escape did not dismiss. Explicit focus return was not isolated. The SDK
button did not fire in the combined run immediately after overlay cleanup
(no opening/error record). An isolated fresh-boot SDK-only run of the same
installed app (mvspbz2e) did open ContentDialog and get through initial focus
and Tab cycling, but programmatic UIA focus moved into the background. The
probe stopped before Escape, so neither a complete SDK pass nor an architecture
replacement was inferred. Log: research/windows61/windy-os-sdk-only.log.

The current candidate instead preserves the existing RootLayout/portal
presentation. A Windows-only overlay lifetime leaf guards background control
focus and panel hit testing with shared ownership for nested/out-of-order
cleanup, preserves the RootLayout shade, uses native Tab cycling/initial focus,
and dispatches raw Escape from the modal host through the layer stack. Other
overlay kinds delegate to the common lifetime. Focus restoration is deferred
one microtask and still checks its declaring XamlRoot, activation and target.
The first focused mock run passed 20/21 because the nested-host mock omitted
the UIElement hit-test property; the corrected model passed. After adding
async focus failure and empty-content fallback cases, all 23 maintained mock
contracts passed via an uncached Turbo test:modal task in 2.311s. Log:
research/windows61/windy-modal-contracts-final-detail.log. This does not prove
OS modal behavior; the candidate native/typecheck build is running as version
1.0.0.3. No public support checkbox, recipe target or shared audit was changed.
The skill now reflects the bounded input/scroll observations and remaining
IME/lifecycle/multiple-window gates.

## Modal candidate: transport interruption

The final 23 mock contracts passed before the native build attempt. The build
started with the owned package version 1.0.0.3 and the existing sequential
Turbo dependency graph, then SSH disconnected with connection reset/broken pipe
(exit255). Subsequent bounded SSH attempts timed out on port22; the audit did
not reach the host. Neither native compilation nor the candidate standalone
typecheck is established by this attempt. Log:
research/windows61/windy-modal-native-build.log. The last verified standalone
Windows typecheck remains the v2 case, before the modal source changes.

Keep the modal implementation and its maintained contracts uncommitted until
the native attempt is inspected/recovered. Candidate file SHA256 values:

- packages/ui/src/overlay-lifetime.windows.ts: 728dfe6d2a6fd7a2b1aa1ca6574a0026d8d1b7aa8bd772dfeabd8cd6ca040f5b
- packages/ui/src/layer-keys.windows.ts: 205a3de2fab8df33269a194f54b0c3f4a7d41a3f99cf8eb69277c6f5b3b07e81
- packages/ui/tests/windows-modal-overlay.test.mjs: 0e2b52439a584a14f5c19c4caf2a09e964060bff1d5a00d9ae3700c826820845
- packages/ui/tests/windows-layer-focus.test.mjs: bfeb017a40670a61c0f88bc9599e83643001afaf0b854ea001cfe343cb429737

The next authorized action is to reconnect to windy and inspect only the owned
process tree/logs/MSIX before starting anything else. The disconnected SSH
wrapper released its resource reservation, but a remote child might remain;
reserve the device/build slot before waiting on or resuming that child. Do not
launch a second native graph blindly. The existing audit script is
C:/Users/alecs/dev/windows61-modal-build-audit.ps1 when the upload is present;
otherwise upload the local /tmp/windows61-modal-build-audit.ps1 with bounded
SSH/connect timeouts. It reports only owned process IDs and artifact metadata.

If no build is running and its outcome cannot be recovered, retain version
1.0.0.3 and rerun from the owned root (do not rerun the version-increment prep):

```sh
pnpm exec turbo run typecheck build:windows --filter=@xplat/windows --concurrency=1 --continue=dependencies-successful --output-logs=errors-only
```

Then use a separate device/desktop-input reservation for the existing owned
install/launch/UIA wrapper and the 12-scenario common driver, which now excludes
the separately retained SDK probe. Wake/reconnect is an external availability
blocker, not a request for new test permission: the human's ok go authorization
continues to apply. No expensive check outside that bounded phase is newly
authorized. Wider UI package/dependent/packed checks remain outstanding at the
earlier commands. No fully qualified Windows support or modal runtime pass
is claimed, and the persistent goal remains active.


## Modal candidate: recovered build and first repaired OS run

SSH recovered without a new permission request. The original disconnected
version 1.0.0.3 Turbo process was reattached rather than duplicated; it exited
0 and its standalone Windows typecheck passed. Its delegated build checker
nevertheless reported 23 diagnostics: the 12 earlier unrelated diagnostics
plus 11 new errors caused by the Windows helper importing its own selected
basename. Those errors were not accepted as a pass. Moving the unchanged
common lifetime to overlay-lifetime-common.ts and reexporting it from the
default leaf removed that resolver cycle. The copied implementation matches
HEAD's original overlay-lifetime.ts byte for byte. A maintained TypeScript
semantic test now exercises Windows moduleSuffixes resolution.

The version 1.0.0.4 native graph reported 37/37 successful tasks (28 cached)
in 9m57.701s. The outer phase exited 0; see the later child-exit capture
limitation below. Its delegated checker returned to the same 12 diagnostics in
11 files; no changed modal file was diagnosed. These remaining errors mean
the delegated check is not clean despite successful native compilation.
Logs: research/windows61/windy-modal-native-fixed.log and
windy-modal-v4-native-task.log.

The actual v4 OS run, boot mvsrk3b4, passed 11 of 12 scenario groups. The six
input and three scrolling groups passed again. Dialog now passed pointer
opening/initial focus and repeated Tab containment, including rejection of a
UIA attempt to focus the background. Physical Escape dismissed the dialog,
but the explicit focus target was not restored, so the combined Escape/return
group failed. No modal support gate is closed. The dropped loaded-event
transaction warning also remains. Log: research/windows61/windy-os-modal-v4.log.
The temporary interactive task initially queued because its default settings
required AC power. Only that owned task's battery constraints were removed;
no system power policy or unrelated task was changed. The temporary helper
now applies those settings when creating future owned tasks.

The next candidate adds a lazy opaque key scope to the internal layer entry:
Windows Escape selects the top layer in its own XamlRoot, even when another
window owns a newer layer. Adapters without a scope retain existing global
selection. The focus adapter also retains an explicit target when the scoped
snapshot projection throws; missing snapshots never trigger an unscoped
lookup. All 27 focused contracts, including the Windows semantic-resolution
check, passed through uncached Turbo test:modal in 4.596s. The new modal test
is registered in ui's maintained test:native command. Logs:
research/windows61/windy-modal-scoped-contracts.log and
windy-modal-scoped-contracts-detail.log. Formatter, targeted lint and
whitespace checks passed. Version 1.0.0.5 is building with temporary fixture
focus diagnostics; neither that source's native result nor focus-return
behavior is established yet. Full UI/dependent/packed checks remain deferred
at the earlier exact commands; no audit snapshot, checkbox or recipe support
claim changed.


## Modal candidate: explicit return passes on the OS

The v5 native graph reported 37/37 successful tasks (28 cached) in 9m24.919s;
the native task log reports Build succeeded and the same 12 delegated-checker
diagnostics in 11 unrelated files. Its Start-Process child-exit JSON contained
null, despite the outer SSH phase exiting0. Treat the task summary, native
log and resulting package as build evidence; the outer status is not a captured
numeric child exit. The v6 helper now invokes pnpm.cmd directly and records
LASTEXITCODE, failing if that value is absent. No delegated-checker pass is
inferred from native compilation.

The first v5 OS attempt, boot mvss0sqs, stopped before typing because foreground
ownership was lost. The guard prevented input outside the owned process. The
retry moved the single activation request after the fresh app-ready marker;
it never reactivates after input begins. That same installed v1.0.0.5 package,
boot mvss2pgn, passed all 12 bounded scenario groups, including physical Escape
dismissal and explicit finalFocusRef return. The six input and three scroll
groups passed again. Log: research/windows61/windy-os-modal-v5-ready.log;
the rejected setup is retained as windy-os-modal-v5.log.

The temporary diagnostics establish the return failure: this runtime exposes
no GetFocusedElementWithRoot function. InputActivationListener reported
actual=expected=2, and the explicit target was loaded/enabled. Preserving the
explicit target when snapshot capture throws fixed the OS scenario. An opaque
WindowId-to-string diagnostic itself threw a caught Symbol-conversion error;
that probe was changed to a boolean presence check. No user data was read.
The dropped loaded-event transaction warning still occurred in this passing
scenario run, so this is not a clean-runtime verdict or full Dialog support.

The v6 candidate additionally tries the C# GetFocusedElement(XamlRoot) spelling
when the WinRT metadata spelling is absent, always passes its captured owner,
and rejects a returned element from a different root. Microsoft documents the
[scoped overload and its metadata name](https://learn.microsoft.com/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.input.focusmanager.getfocusedelement).
The declaring-window activation check is retained; the
[activation lookup](https://learn.microsoft.com/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.input.inputactivationlistener.getforwindowid)
is separate from visibility and focus-target ownership. The fixture adds a
second physical dialog opening/closing scenario without finalFocusRef; its
result is pending. A 250ms setup delay between the dialogs allows the declared
140ms exit animation to release its shade; that delay is not dismissal proof.

For the loaded-event warning, the Windows scroll hook now updates its measured
snapshot immediately, then defers only its load-event state publication by one
microtask. It checks that the same loaded viewport still owns the queued
publication and skips detached/unmounted hosts. Caller lifecycle callbacks and
scroll/layout publication retain their existing behavior. This is a candidate
local workaround for the observed Octane universal/NativeScript event-scope
failure, not an upstream renderer fix or established root cause. Upstream
versions examined: octane0.14.0 and @nativescript-community/octane0.2.5 with the
repository patches. The latter driver already defers events arriving during
native batch application; the extra deferral tests publication after the loaded
event scope itself. The actual warning-free result remains pending.

Focused Turbo tasks passed 29 modal/focus contracts (4.984s) and 10 scroll
contracts (3.501s), including scoped .NET capture, foreign-return rejection,
fresh load snapshots without synchronous publication, and skipped publication
after retirement. Logs: research/windows61/windy-modal-default-contracts-detail.log
and windy-scroll-load-contracts-detail.log. V6 native compilation and its
13-scenario OS run are pending. No broad typecheck, packed consumer, multiple-
window, IME, visual, resize/remount or alternate-architecture pass is claimed.


## Qualified bounded common-flow batch (v6)

Local source commits: 350aa9295 (Windows modal containment/focus and internal
owner-scoped Escape), 0ada8c971 (Windows loaded scroll publication). The
unchanged common lifetime was extracted mechanically; no AppKit/GTK leaf or
service changed. The native v1.0.0.6 graph completed 37/37 tasks (28 cached)
in 9m26.654s, with numeric LASTEXITCODE=0 recorded. The native task log says
Build succeeded; its delegated checker still reports the same 12 diagnostics
in 11 other files. It is not a clean whole-program typecheck. Logs:
research/windows61/windy-native-v6.log, windy-v6-native-task.log and
windy-v6-native-exit.json.

The actual x64 packaged WinUI run (boot mvssk5yj, owned family
org.octanexplat.windows61_8w7k1f04p0kxp) passed all 13 bounded scenario groups:
the six input groups, four modal groups and three scroll groups. The new modal
group used a second physical button to open the dialog without finalFocusRef;
physical Escape dismissed it and focus returned to that declaring trigger.
Both the explicit and default cases passed with the final owner-scoped key
selection. The two scroll viewports advanced from 0 to72 under physical wheel
input and the hook reported overflow/leaving the start edge. This is actual
OS input/focus evidence, separate from the 29 modal/focus and 10 scroll mocked
contracts. Logs: research/windows61/windy-os-common-v6.log and
windy-v6-os-results.json.

The full current-boot console contains no dropped loaded-event warning. That
observation supports this local Windows load-publication workaround; it does
not establish a general upstream transaction fix. The fixture recorded one
WinRT command-channel read failure and recovered on a later poll; every
required command acknowledgement and scenario passed. Its root cause is not
established. The fixture's deliberate old-metadata-name probes still record
caught missing-function errors; the implementation uses the other scoped
spelling. Do not call the complete console error-free or infer public files
API qualification. Full and isolated logs: windy-v6-full-console.log and
windy-v6-current-boot-console.log under research/windows61/.

Seven runtime source SHA256 values were compared with the remote owned source
and all matched the local candidate; installed version was 1.0.0.6. The mapping
is retained in research/windows61/windy-v6-provenance.json. The remote root
remains C:/Users/alecs/dev/win61-c905842a3, detached at c905842a3 with the recorded
source overlays and qualification-only package identity/version, pnpm policy,
temporary app entry and Turbo helper tasks. Original Windows app data and the
shared checkout were preserved. The owned app was stopped after the run and
build/input reservations ended. No screenshots or visual analysis were used.

Formatter, targeted lint, whitespace and pnpm check:recipes passed. The recipe
check covers structure/local links, not runtime support. Public Windows input,
modal and scroll guidance and the Octane skill now reflect the bounded evidence.
No public API signature or recipe invocation changed, so maintained app/example
call sites need no migration. No recipe supported-target list, shared audit
snapshot or evidence-gated issue checkbox changed. Windows remains experimental;
there is no new stable Windows release/support claim or release note.

The following wider checks remain deferred under the human's resource boundary;
the bounded authorization did not run them or establish their results:

```sh
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run test:native --filter=@octane-xplat/ui
pnpm exec turbo run test:packed --filter=@octane-xplat/ui
```

Earlier exact commands for other affected packages remain outstanding as
recorded above. Required dialogs, nested/out-of-order overlays on the OS,
dynamic background enabled/interaction changes while modal, multiple-window
activation/focus, IME, visual/layout/accessibility parity, public normalized
hardware keys, scroll content mutation/remount/resize/RTL and alternate
architectures remain unqualified. The synchronous core File.exists mismatch
also remains open; raw async fixture reads do not qualify the public files
service. Keep those gates pending and prioritize these common-flow/lifecycle
and everyday-service gaps before niche integrations.


## Windows synchronous filesystem candidate

The next common-flow prerequisite is the existing File.exists mismatch. The
repository's file-picker probe (packages/app/src/platform/filepick.mobile.ts)
seeds a document, picks it and reads it; that probe is explicitly iOS-only and
is not Windows evidence. Treating everyday document/storage flows as higher
demand than niche integrations is an assumption informed by that existing flow
and the user priority. The actual v2-v6 Windows fixture additionally observed
core File.exists=false while async WinRT PathIO read the same existing native
path. This batch targets the low-level core prerequisite; it does not qualify
the separate public @octane-xplat/files facade, whose Windows leaf already
uses async WinRT operations.

Source: the exact owned installed preview file
file-system/file-system-access.windows.js was copied into
research/windows61/core-filesystem/preimage/. Its synchronous existence method
returned an initially false variable populated by WinRT completion callbacks.
That source relies on completion callbacks supplying its return value. The
actual runtime false result is separate evidence; exact callback timing/root
cause was not re-probed. getFile also wrote an empty string when that check returned
false. The scripted model reproduces existing content being cleared on this
path; no actual user-file truncation was performed or observed. The missing-
folder path requested an existing WinRT folder rather than creating one.

The candidate uses the host's existing System.IO File.Exists/Directory.Exists
for synchronous booleans, OpenOrCreate with a promptly disposed stream for new
files, and Directory.CreateDirectory for parent/missing folders. Existing-file
metadata lookup does not open or write the file. OpenOrCreate preserves a file
that appears after the check; projection failures are not converted to absence
and do not enter a blank-write fallback. GetFile/getFolder retain their error
callback/undefined failure shape. The backend boolean still follows .NET's
permission/error semantics; false is not path validation or proof that a path
never existed. Relevant Microsoft references:
[File.Exists](https://learn.microsoft.com/en-us/dotnet/api/system.io.file.exists),
[Directory.Exists](https://learn.microsoft.com/en-us/dotnet/api/system.io.directory.exists),
[FileMode.OpenOrCreate](https://learn.microsoft.com/en-us/dotnet/api/system.io.filemode),
[Directory.CreateDirectory](https://learn.microsoft.com/en-us/dotnet/api/system.io.directory.createdirectory).
NativeScript Windows alpha.144's runtime/src/js/dotnet.js already provides the
System namespace and preserves it when Core assigns its SystemJS shim; its
own test-app uses System.IO. No new dependency or native host source was added.

Ten focused contracts evaluate the full distributed FileSystemAccess artifact
against fake native I/O: file/folder distinction, missing/invalid paths,
Unicode/drive-root/relative arguments, existing contents, completed empty-file
creation/disposal, a competing creator, projection failures, parent/open/close
failures, folder creation and collision. The original preimage failed9/10;
the candidate passed10/10 through a single uncached Turbo task with no build
dependencies. Final runs used existing Turbo2.11.4 and Node26.12.0 on macOS,
not a Windows runtime. An earlier eight-case run used the global Turbo2.10.11
fallback and was superseded; no dependency was installed to change versions.
Logs: research/windows61/filesystem-preimage-final.log,
filesystem-candidate-final.log and filesystem-candidate-final-detail.log.

The final validation invoked the already-installed repository Turbo binary:

```sh
WINDOWS_CORE_ARTIFACT="$PWD/research/windows61/core-filesystem/candidate" pnpm exec node /Users/alec/dev/alloc/octane-xplat/node_modules/.pnpm/turbo@2.11.4/node_modules/turbo/bin/turbo run test:filesystem --filter=@xplat/windows --concurrency=1 --output-logs=errors-only
```

The dry run contained exactly that task and no dependency/build/generation
work. Effective local pnpm verifyDepsBeforeRun=false prevented an implicit
install. The maintained task uses the installed patched core by default and
accepts WINDOWS_CORE_ARTIFACT for private copies. It is registered only in the
Windows app manifest/Turbo config. Formatter and targeted lint passed.

The canonical preview patch appends only this filesystem section; all prior
CSS, pointer, input, keyboard and module-cycle sections remain byte-identical.
The new section applied and reversed exactly against the copied installed
preimage and reproduced the tested candidate. An independent public tarball
re-fetch from pkg.pr.new returned HTTP403 on the reading host; fresh archive
application is not established by this check. The generated patch-package
copy and manifest/root metadata were synchronized; pnpm check:patches passed.
The lockfile changes only substitute the preview-core patch hash. New SHA256:
85519b427a86b56002736f7c5b44eb277e706b209d79cd1e51e23e932e185527.
Provenance: research/windows61/core-filesystem/patch-provenance.json.
The sync/check initially could not resolve yaml in this isolated worktree;
a temporary link to the existing yaml2.9.1 package was used and removed after
checking. No install or mutation of the original checkout occurred.

**The native-qualified v6 MSIX and installed dependencies still use the old
f6bf77c5 patch. Its 13 OS passes do not qualify this new filesystem patch.**
Native BCL projection, real file/folder creation and collision, packaged path/
permission behavior, handle cleanup, and post-adoption common-flow regression
checks remain pending. Core read/write/metadata/enumeration and the public files
facade were not repaired or qualified by these existence/creation contracts.
No source-audit, issue checkbox or supported recipe target changed.

The following are exact deferred adoption/check commands; do not treat them
as passed or automatically rerun dependency installation/native builds outside
the human-authorized phase:

```sh
pnpm install --frozen-lockfile
pnpm exec turbo run test:filesystem test:keyboard --filter=@xplat/windows --concurrency=1
pnpm exec turbo run typecheck --filter=...@octane-xplat/cli
pnpm exec turbo run typecheck --filter=...@octane-xplat/patches
pnpm exec turbo run typecheck --filter=...@xplat/windows
pnpm exec turbo run build:windows --filter=@xplat/windows --concurrency=1 -- --release
```

After adoption, a separate owned x64 native case must compare core File.exists
and Folder.exists with actual files/directories; verify that File.fromPath
preserves existing bytes and synchronously creates a new empty file; verify
Folder.fromPath creates nested directories; exercise failure/collision and
cleanup paths; then rerun the bounded modal/input/scroll case. Use only new
owned temporary paths. This is a pending native requirement, not supplied by
these Node/VM tests. The earlier UI/dependent/packed commands also remain
outstanding. No stable-release fix note is added for this unreleased Windows
preview repair.


## Repaired-core adoption resumed

The earlier human go-ahead covers repaired-core adoption and the bounded
Windows harness phase, including its necessary prerequisites. This continuation
therefore resumed adoption rather than requesting the same permission again.
The earlier filesystem deferral above is historical. Broader package/dependent
checks and visual analysis remain outside this phase.

In the existing owned C:/Users/alecs/dev/win61-c905842a3 checkout, the 85519b42
patch and lock metadata were transferred without replacing the qualification
identity/resources or unrelated source overlays. The old owned configuration
was saved as qualification/core-fs-config-before.tar before applying it.
Effective pnpm verifyDepsBeforeRun=warn was retained. Frozen installation with
lifecycle scripts disabled succeeded (pnpm11.24.0, 2m7.1s): lock resolution was
skipped, three packages were reused, none downloaded, +3/-2 peer-context links.
The installed filesystem SHA256 is
21ca2214a146fac1c1de51c41fe46c5e984016bc8f6de671642d7ca8a870b23f,
matching the candidate. This establishes cached-package patch application;
it does not establish a successful fresh network download after the earlier
HTTP403. The installer warned that packages/create/dist/index.js.EXE was absent
while creating a create-octane-xplat bin link. That generated creator entry
was not used by the qualification tasks; no broad creator build was run.

Four focused uncached Turbo tasks passed against the installed source:
filesystem10, keyboard/pointer31, modal/focus29 and scroll10 (80 contracts),
4/4 tasks, 14.262s, exit0. These still use fake host/I/O objects. Log:
research/windows61/windy-fs-adoption.log. The maintained default filesystem
contract task now passes against the installed patched package, separately
from the earlier private artifact tests.

A temporary app helper adds seven real owned-temp prerequisite checks: public
Core file/folder existence and wrong-kind/missing results, existing File.fromPath
bytes, immediate new empty-file creation, immediate nested-folder creation,
exclusive reopen after stream disposal, rejection of a folder/file collision,
and owner-marker-guarded cleanup. It uses only a new uniquely named directory
under this app's temporary folder. Its System.IO reads are an independent
contents oracle; it does not qualify Core read/write methods. The existing
13 input/modal/scroll groups remain in the driver, plus one group checking all
seven prerequisite results and Core/async command-file agreement (14 groups).
The helper/driver are temporary research fixtures, not supported API evidence
until actually run. The old deliberate missing-metadata-name diagnostic now
uses the scoped C# spelling instead. No product source changed for the probe.

Version1.0.0.7 started the existing sequential Turbo typecheck/build:windows
graph under a device/native-build reservation. That original local SSH session
is still attached, but new source-log-copy and audit SSH connections repeatedly
timed out on port22. Remote process/exit/artifact state is currently unknown.
Do not start another graph from a timeout or from the presence of a lock file.
The current phase log is research/windows61/windy-native-v7.log; its remote
terminal record is qualification/core-v7-build-exit.json if the phase finishes.
Inspect the same owned process tree and the .turbo logs after reconnection.
A wake/reconnect request was sent; this is availability recovery, not new test
permission. No v7 native build, standalone typecheck, prerequisite or OS-input
pass is claimed yet. The last completed OS run remains v6 on the earlier core.


V7 recovery tooling is prepared locally at
/tmp/windows61-v7-recovery-audit.ps1. It reads the owned terminal record,
process tree, task-log tails and MSIX timestamps, plus recent Kernel-Power
IDs/times without event payloads. Upload/run it only after SSH reconnects;
it does not start, kill or restart a graph. The original local exec session
was2330 and its resource reservation455be34f-b022-4812-98b6-0c255fa8caaa
(device:windy + native_builds1) remained live at the last check. A live local
SSH handle is not remote compilation proof. If that handle disappears, inspect
remote state and re-reserve before waiting on any surviving remote child.

## V7 terminal recovery and explicit filesystem bridge repair

The recovered remote terminal record reports native graph exit0 at
2026-10-29T01:29:52Z. The standalone Windows typecheck emitted no diagnostics;
the native delegated checker still reported the previously recorded12 diagnostics
in11 files. No owned build process remained. Only the verified stale local SSH
transport was terminated; its outer255 is not the native build result. Recovered
records: research/windows61/windy-v7-native-exit.json,
windy-v7-native-task.log and windy-v7-typecheck.log. The v7 MSIX identity version
is1.0.0.7. The earlier live-handle/recovery paragraph is historical.

Actual packaged v7 execution exposed a prerequisite failure missed by the
fake host: Core's global System is its import shim, without System.IO. The first
run (boot mvsveg94) passed six input groups and component wheel scrolling, but
failed filesystem setup and pointer bounds for modal/headless targets. A second
run (boot mvsvzqjz), maximizing only the owned window, passed all six input and
four modal groups. Filesystem setup still failed and the scroll page viewport
was not found, so neither run passed the14-group gate. The second failure is
recorded as setup evidence, not proof that modal focus or scrolling regressed.
Logs: research/windows61/windy-os-common-v7.log and
windy-os-common-v7-maximized.log. No checkbox is closed from these results.

A standalone native probe against the exact alpha144 DLL and packaged
DotNetBridge payload proved NSWinRT.dotnet.invoke('', 'System.IO.File', ...)
and Directory calls still work after replacing System with an import-only
shim. Real owned scratch files were found, new files created empty, existing
contents preserved with OpenOrCreate and streams disposed. Enum fields cannot
be fetched with dotnet.get (it looks for property getters); the repair uses
named constants for documented FileMode/OpenOrCreate4, FileAccess/ReadWrite3
and FileShare/ReadWrite3. Log: research/windows61/windy-fs-direct-enums.log.
This establishes bridge feasibility, not packaged Core filesystem success.

The follow-up patch calls that explicit bridge, preserves the global import
shim, rejects missing/nonboolean existence projections and keeps nontruncating
creation/disposal. Eleven local distributed-artifact VM contracts passed through
the uncached Turbo filesystem task. The fixture now has Core's actual import
shim and an explicit bridge, preventing the earlier false assumption. Exact
patch application/reversal passed and all preceding Core patch sections remain
byte-identical. Canonical patch SHA256:
3be9208c20f59e776d906b8239dac542218415aa85d31dc140893eba8200f2b3.
The temporary native oracle uses the explicit bridge too. Follow-up adoption,
v8 build and actual native checks remain pending here; no native pass is claimed.
Broad package/dependent typechecks, packed-consumer tests, visual checks,
IME/multiwindow and generic layer qualification remain deferred. Required future
package checks include turbo run typecheck --filter=...@octane-xplat/cli and
--filter=...@octane-xplat/patches; no merge or full support claim is made.

## V8 packaged filesystem result

Frozen follow-up adoption completed in36.8s with lifecycle scripts disabled,
three cached packages reused and zero downloads. Installed filesystem SHA256
is ef4e9080313fab6b0680c24a0380cc3ef06f0136c29cb96fc3cf674a2afa8c36.
All81 installed-source contracts passed:11filesystem,31keyboard/pointer,
29modal/focus and10scroll, four uncached tasks in7.315s. The same missing
creator-bin warning remains unrelated to the exercised tasks. Logs:
research/windows61/windy-fs-explicit-adoption.log and its four detail logs.

The v8 sequential native graph passed38/38tasks (zero cached), exit0,
8m52.859s. Standalone Windows tsrx-tsc emitted no diagnostics. The delegated
native checker still reported the previously recorded12diagnostics in11other
files; MSBuild retains duplicate FontManager and missing symbols-tool warnings.
Logs: research/windows61/windy-native-v8.log, windy-v8-native-exit.json,
windy-v8-native-task.log and windy-v8-typecheck.log. Verified package version
1.0.0.8 and existing certificate signing/trust; no system trust was changed.

Actual packaged boot mvswlb9v passed all seven real owned-temp filesystem
checks, with Core.exists and asyncRead bothtrue for the command file. Existing
Unicode contents were preserved, new files and nested folders existed before
return, exclusive reopen proved creation-stream disposal, wrong-kind folder
collision rejected without changing bytes, and marker-guarded cleanup passed.
All six physical input and four modal groups passed too. This is bounded
native prerequisite evidence, not full Core CRUD, public files facade, permission,
other architecture/unpackaged or complete platform qualification.

The run still exited1: after modal dismissal, clicking the scrolling-page
button did not expose its viewport. Records:
research/windows61/windy-v8-os-results.json and
windy-v8-current-boot-console.log. The existing14-group gate therefore did not
pass. A follow-up driver records the actual UIA element at the pointer location
and retains a separate failing pointer-navigation group. Explicit command setup
may then exercise scrolling independently; that setup is not OS-navigation
proof and cannot erase a failed group. This requires no rebuild of v8.

### V8 instrumented OS rerun

The same v8 binary, boot mvswn2av, passed15/15groups and exited0: filesystem
prerequisites (all7cases), six input groups, four modal groups, explicit physical
pointer navigation to the scrolling page and three scroll groups. The driver
added UIA FromPoint metadata before sending input, retained all process,
foreground and pointer-bounds guards, and kept a distinct navigation-failure
result with independent command setup available afterward. That fallback was
not used in this passing run. Both scroll offsets advanced0to72, with content816
and viewport160; the headless block state changed atStarttrue tofalse.

The earlier two maximized navigation failures remain recorded. This one pass
does not establish their cause or deterministic navigation reliability; the
instrumentation may affect timing. No product navigation fix is claimed and no
full API/UIA/presentation/permission/architecture checkbox is closed. Records:
research/windows61/windy-os-common-v8-navigation.log,
windy-v8-navigation-os-results.json, windy-v8-navigation-full-console.log and
windy-v8-navigation-current-boot-console.log. Existing signing trust was used,
only the owned app ran, and its process stopped in wrapper cleanup. No visual
analysis was performed. Skill platform-leaf/primitive guidance was reviewed;
no existing advice relies on global System.IO or claims full filesystem support.
No recipe target is promoted by these bounded prerequisite repairs.

The next focused lead is the overlay exit interval, not a confirmed navigation
cause. Actual installed RootLayout.close removes its popup registry entry
immediately but retains the host/shade until Promise.all(exit animations)
finishes. The Windows shade exit uses the default300ms animation; Dialog's
content exit is140ms. The framework common lifetime releases background guards
and unmounts portal content before awaiting owner.close. Thus absence of dialog
fields and restored focus alone do not establish that the native shade has
finished leaving. Source copies: research/windows61/core-index.windows.js and
core-root-layout-common.js (cached SDK source lacks the Windows leaf, so the
exact installed artifact was inspected). A controlled native measurement is
needed before choosing a lifecycle repair; do not disable animation or bypass
ownership to make the driver pass. The instrumented15-group pass remains
bounded evidence and does not resolve this lead.

## Controlled post-modal transition reproduction and candidate

The same packaged v8 binary, boot mvswv12r, reproduced lost background clicks
without the added FromPoint inspection. Three immediate trials failed at97,
59 and64ms from Escape to the click after default-trigger focus returned.
Alternating trials with350ms extra wait passed at415,432 and422ms. Six trials,
three failures, exit1. The delay is an experimental control, not a workaround
or weakened gate. A recovered command-channel WinRT read error is present in
this boot; no blanket error-free claim is made. Source/measurements support an
exit-lifecycle race, beyond the earlier unclassified navigation timing concern.
Logs: research/windows61/windy-os-modal-transition-v8.log,
windy-v8-transition-os-results.json and windy-v8-transition-full-console.log.

A Windows-only candidate tracks actual owner.close completion by XamlRoot and
waits before returning layer focus. It rechecks window activation, host ownership
and current target eligibility after the wait. Other roots and non-dialog
lifetimes retain their paths. No animation is disabled and no delay is added to
the immediate-click criterion. The existing VM fixtures now load the real exit
barrier: delayed native close holds focus, another root remains independent,
multiple exits must all settle and a target disabled during exit is skipped.
All31focused modal/focus contracts passed through the owned Windows Turbo task
in3.592s (uncached, exit0). Local test:modal was unavailable in the canonical
app task configuration; no local pass is claimed. Targeted formatter/lint and
whitespace checks passed. Sem source impact/diff was reviewed; dynamic VM test
edges are not resolved by its static graph.

The candidate remains uncommitted until native qualification. Version1.0.0.9
started the same sequential native graph in the owned checkout with the same
adopted3be9208cCore. The v8 filesystem repair remains committed/qualified in its
bounded cases. Do not present v8's instrumented15-group pass as qualification
of this new focus barrier. Broad package/dependent checks, visual/multiwindow
and generic-layer gates remain deferred.

### V9 runtime rejected the focus-only candidate

V9 native graph passed38/38tasks (28cached), exit0,6m18.281s; standalone
Windows checker emitted no diagnostics and delegated checker retained the same
12diagnostics. Its first timing run stopped before input because the UIA
maximize pattern was unavailable. This setup failure is preserved separately.
The driver now maximizes only its verified PID-owned HWND with Win32 ShowWindow
and verifies IsZoomed, retaining all foreground/process/point guards.

Retry boot mvsxdwq3 reproduced all three immediate failures at200,65 and60ms;
three delayed controls passed at421,568 and411ms. Focus-only deferral is therefore
insufficient and remains uncommitted. Logs: research/windows61/windy-native-v9.log,
windy-v9-native-exit.json, windy-v9-typecheck.log,
windy-os-modal-transition-v9.log (setup),
windy-os-modal-transition-v9-retry.log, windy-v9-transition-os-results.json and
windy-v9-transition-full-console.log. Filesystem7cases still passed in this boot.

The follow-up retains background input guards through actual native close.
The close promise restores those guards in finally before settling the root's
focus barrier. Setup failure without a native close releases guards on the next
microtask; synchronous/rejected close still releases guards and leaves the
original error-reporting/removal path intact. Guards preserve overlapping owner
tokens and application-disabled controls. This keeps background controls unavailable while the exiting shade can still
intercept pointer input; its actual focus behavior remains a native test gate.

All32focused contracts passed in2.7s (uncached), including delayed native close
ordering and both thrown/rejected-close cleanup. The earlier31-case attempt
failed its isolated ES-only type-resolution contract because queueMicrotask was
not declared there; source now uses Promise microtasks without adding ambient
DOM declarations or weakening that contract. Targeted formatter/lint and
whitespace checks passed. Log: research/windows61/windy-modal-exit-guard-contracts-32.log.
V10 native graph is running; neither new native success nor a completed repair
is claimed. The v8 explicit filesystem bridge repair remains committed.

## V10 native modal teardown repair qualified in bounded common flows

The final guard-plus-focus candidate passed the v10 graph:38/38tasks,
28cached, exit0,6m2.993s. Standalone Windows tsrx-tsc emitted no diagnostics;
the delegated native checker retains the same12diagnostics in11otherfiles and
MSBuild retains the same three warnings. Records:
research/windows61/windy-native-v10.log, windy-v10-native-exit.json,
windy-v10-native-task.log and windy-v10-typecheck.log. Existing certificate
signing/trust and explicit identity/version1.0.0.10 were checked again.

Paired native regression boot mvsxr5we passed6/6trials, exit0. All three
immediate clicks after default focus return navigated, without an added test
sleep: Escape-to-click442,421 and450ms. The alternating350ms delayed controls
passed at834,800 and795ms. The unchanged wait for returned trigger focus now
ends after native teardown; the source has no fixed timeout workaround. Native
background IsEnabled remainedfalse in the existing250ms diagnostic while the
backdrop was still exiting. This directly contrasts with the failed v8/v9
immediate trials. Records: research/windows61/windy-os-modal-transition-v10.log,
windy-v10-transition-os-results.json and windy-v10-transition-current-boot-console.log.

Full common-flow boot mvsxs6vd passed15/15groups, exit0: seven native app-temp
filesystem cases as one prerequisite group, six physical-input groups, four
modal groups, physical pointer navigation after dismissal, two physical wheel
groups and headless overflow/start-edge state. Pointer FromPoint instrumentation
was removed; command navigation fallback was not used. Both native scroll
offsets advanced0to72 (content816, viewport160). Records:
research/windows61/windy-os-common-v10.log, windy-v10-os-results.json,
windy-v10-full-console.log and windy-v10-current-boot-console.log. The wrapper
stopped only its owned app after each run and released its device/input phase.

The repair retains background guards through owner.close.finally, releases
those guards before settling the owning XamlRoot's focus barrier, and checks
activation/target eligibility again before focus. Failed setup and thrown or
rejected native close retain cleanup/error paths. The Windows skill reference
and modal setup guide now explain that focus returns after backdrop exit.
No new public API, dependency, supported recipe target or stable-release bug
note is introduced; this repairs the unreleased experimental Windows path.

Remaining gates stay open: full package/dependent typechecks, packed consumers,
full public files/Core CRUD, native permission/error matrices, generic useLayer,
required/nested dialogs, multiple windows, IME, other architectures/unpackaged
runs, visual/layout parity and broad component/optional-service coverage.
Exact before-merge commands remain deferred, including:

```sh
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run typecheck --filter=...@octane-xplat/cli
pnpm exec turbo run typecheck --filter=...@octane-xplat/patches
```

No push/merge or full native-platform qualification is claimed. Historical
uncommitted/pending v9/v10 paragraphs above describe their phase at that time;
the final repair and bounded native results supersede those candidate boundaries.

Final focused source rerun on the installed candidate passed84contracts:
11filesystem,31keyboard/pointer,32modal/focus and10scroll. Four uncached Turbo
tasks,7.694s,exit0. Logs: research/windows61/windy-final-common-contracts.log
and windy-final-{filesystem,keyboard,modal,scroll-load}-detail.log.
The run warned: node_modules is out of sync with the lockfile because the
value of enableGlobalVirtualStore changed. The explicit effective setting read
undefined; no install or global configuration change was made to repair this
metadata warning. verifyDepsBeforeRun=warn remained asserted. A read-only final
audit reconfirmed the installed Core filesystem SHA256ef4e9080… and zero owned
app processes. Environment metadata reproducibility remains a recorded limitation.

## Windows Switch engine and shared-component candidate

Demand remains common forms: ControlsDemo and Test use Switch. The existing
self-drawn native track handles taps but has no native keyboard/TogglePattern
input. No shared audit snapshot or broad issue checkbox was changed.

A preliminary file-stream cleanup probe could not qualify deterministic
closure. The runtime exposes neither input.Close nor IClosable.prototype.Close;
an exclusive .NET open also succeeded before any attempted closure, despite
retaining the native input proxy. That oracle therefore did not demonstrate a
live handle conflict. No handle-leak claim, unsafe pointer workaround or new
files implementation was added. Log: research/windows61/windy-native-stream-close.log.

The temporary WinUI ToggleButton probe initially failed because IsChecked is
projected as an IReference<Boolean> object, rather than a JS Boolean. V12
passed two groups and failed five; boot mvt0dexj records the actual typeof and
projection name. V13 uses Checked/Unchecked event identity and a transparent
ControlTemplate. Its native graph passed38/38tasks,34cached,4m26.598s,exit0.
Standalone Windows checker emitted no diagnostics; delegated checker retained
12diagnostics in11otherfiles and the existing three MSBuild warnings.

The first v13 OS run passed five groups and failed two pointer assertions due
to a PowerShell5 scalar-count error in the driver. The same package, with array
counts corrected, passed7/7groups, boot mvt0pq8u, exit0: four TogglePattern peers
with enabled/focusable states, physical pointer/Space/automation activation,
accepted/rejected controlled requests, readonly rejection and disabled
focus/automation rejection. This qualifies the bounded native engine, not the
shared Switch component. Failed runs remain retained. Logs:
research/windows61/windy-native-v13-toggle.log,
windy-v13-native-exit.json, windy-v13-typecheck.log,
windy-v12-toggle-os-results.json, windy-v13-toggle-os-results.json,
windy-os-toggle-engine-v13-retry.log and windy-v13-toggle-retry-os-results.json.

The Windows-only shared candidate retains the shared track/thumb and adds a
transparent native input. Its controller guards programmatic echoes, blocks
readonly/model-disabled/native-disabled requests, reads callback replacements,
and unbinds stale native handlers while preserving the callback on native
recreation. Nine focused VM contracts passed through one uncached Turbo task
in2.683s, exit0. They are included in the maintained test:native list. This is
source-contract evidence, not OS interaction evidence. Log:
research/windows61/windy-toggle-source-contracts-detail.log.

V14 built38/38tasks,28cached,6m6.395s,exit0, with the same checker/warning
boundaries. Native component setup failed: the unlabelled Switch input was
missing. The owned UIA diagnostic found only the labelled async input, with
empty/offscreen bounds. Bundle inspection confirmed the correct Windows leaf,
private input registration and CSS were packaged. It also showed the candidate's
bare {track} TSRX else branch compiled to an empty range. Per the TSRX skill,
that branch now ends in an explicit JSX fragment. This was a candidate authoring
error, not an upstream compiler defect.

The cached MasonKit1.0.0-beta.126 foreign-layout source explains a second
prerequisite: Windows leaves width/height to XAML and mirrors position/insets
into Mason. The candidate's percentage dimensions are replaced by all four
edge insets. V15 is running to test the actual resulting geometry; no native
layout repair or shared-component pass is claimed yet. Retained records:
research/windows61/windy-native-v14-shared-switch.log,
windy-v14-native-exit.json, windy-v14-typecheck.log,
windy-v14-shared-os-results.json,
windy-os-shared-switch-v14-diagnostic.log and
windy-v14-shared-diagnostic-os-results.json.

Targeted lint, formatter and whitespace checks pass. pnpm check:recipes passes;
no recipe target was promoted. The new documentation commands are absent in
this isolated revision: pnpm check:docs and pnpm check:doc-examples both exit1
with command-not-found. A syntax-only supplement imported the shared checkout's
checker functions and parsed26fences in the two changed guides. An existing
adjacent-JSX typography example in the touched skill reference was wrapped in
a fragment so it parses. This is not import/type/runtime or full documentation
qualification. Public setup and skill guidance retain candidate boundaries.

Remaining broad gates and exact commands stay deferred:

```sh
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run test:native --filter=@octane-xplat/ui
pnpm exec turbo run test:packed --filter=@octane-xplat/ui
pnpm check:docs
pnpm check:doc-examples
```

The latter two require the repository revision that supplies those scripts.
V15 uses the already-authorized bounded graph and owned Windows app/input
workflow; no unrelated dependency installation, native binary rebuild, visual
analysis, push or merge is authorized or implied. Source is an uncommitted
candidate until its remaining integration problem is resolved.

### V15 keeps layout and rollback gates open

V15 graph passed38/38tasks,28cached,6m11.902s,exit0. The standalone checker
emitted no diagnostics; delegated/checker warnings are unchanged. Bootmvt1kr6s
failed eight of ten shared groups. The fragment repair exposed all controls
and physical Tab order passed, including readonly focus and disabled exclusion.
Readonly/disabled rejection also passed. All input bounds remained empty,
so pointer tests failed their required on-screen guard. Failures after an
aborted pointer group are not evidence of extra model callbacks; the prop-write
scenario now snapshots its own count and establishes its own checked setup.

The same v15 binary ran an independent state diagnostic, bootmvt1sz58:
physical Space accepted true, UIA toggle accepted false, and programmatic
controlled reset passed without a callback echo. Label activation produced
exactly true then false callbacks and one action, but the native async peer
remained checked. That last group failed. Callback dispatch alone therefore
does not establish rollback. NativeScript's cached Property source defaults
to the declared false value when no getDefault method exists; an unverified
getDefault workaround was not added.

Records: research/windows61/windy-v15-shared-os-results.json,
windy-v15-shared-current-boot-console.log,
windy-os-shared-switch-v15-state.log and windy-v15-state-os-results.json.
V16 adds a Mason overlay container with the plain native control as a flex
child, plus temporary core/native layout/model snapshots and three layout
probe variants. Its graph is running. These are candidates, not a claimed
layout or rollback repair. No implementation commit is made while unresolved.

### V17 qualifies common shared Switch input flows

V16 completed38/38tasks,28cached,6m14.683s,exit0. Shared OS checks passed3/10:
Tab order, controlled prop reset without callback echo, and blocked states.
Input bounds remained empty. The async label request emitted true,false and
one action, but Core checked=true and on/loading classes remained after
rejection. These are retained failures, not passes inferred from callbacks.

An independent v16 layout probe found finite40x24-DIP native children had
80x48 physical-pixel bounds at200% DPI; the nested stretch child stayed empty.
That probe did not independently prove absolute positioning. Source inspection
of MasonKit1.0.0-beta.126 and the pinned @nativescript-community/octane0.2.5
patch found two relevant constraints: Windows foreign layout does not mirror
width/height, and applyMasonDefaults assigns local style.position='relative',
which overrides author CSS. The latter remains a shared-renderer defect; no
global renderer patch was changed by this Windows leaf.

The final leaf uses the existing useMeasure helper for finite input dimensions
and sets position locally. The native ToggleButton is a direct track child.
The adapter also temporarily detaches only its own Checked/Unchecked delegates
around IsChecked writes and restores them unless that native instance was
disposed/replaced. A counter alone avoided callback echoes but still entered
JS synchronously from a host prop write. The combined v17 changes pass below;
the exact cause of the earlier native async failure was not separately isolated.
These workarounds must be reassessed when the renderer/runtime changes.

Focused contracts now pass11/11 through one uncached Turbo task,2.373s,exit0.
They execute the actual controller source with a nullable-Boolean read trap,
and cover programmatic delegate suppression/restoration, accepted/rejected
model state, readonly/model/native disabled gates, callback replacement,
native recreation/stale callbacks, disposal during a write and write-error
cleanup. They do not establish native geometry or OS interaction. A temporary
Node universal-runtime isolate also passed4/4 direct/nested compiled async
cases; that is not WinUI runtime evidence.

V17's bounded native graph passed38/38tasks,28cached,6m8.167s,exit0:

```sh
pnpm exec turbo run typecheck build:windows --filter=@xplat/windows --concurrency=1 --continue=dependencies-successful --output-logs=errors-only
```

The standalone Windows checker emitted no diagnostics. The delegated native
checker still emitted the same12diagnostics in11otherfiles; the three recorded
MSBuild warnings remain. This graph does not replace UI/dependent typechecks.
The source overlays used the existing pinned core filesystem artifact
SHA256ef4e9080313fab6b0680c24a0380cc3ef06f0136c29cb96fc3cf674a2afa8c36
and unchanged native DLL
SHA256748D95864AC032DE2D1BB69FEC1E5B2CDD393BAA1671E349AA670160AA66D47C.
No dependency install, new native binary, certificate or trust change occurred.
The pnpm verifyDepsBeforeRun=warn override remains owned-checkout-only;
enableGlobalVirtualStore metadata drift remains an environment limitation.

Owned packaged x64 WinUI MSIX1.0.0.17, bootmvt3yuph, passed10/10groups,
interactive/resource phase exit0:

- Seven named TogglePattern peers with expected state, enabled/focusable flags
  and finite on-screen geometry.
- Physical Tab visits enabled and readonly inputs and skips disabled.
- Controlled physical pointer, Space and UIA toggling produce true,false,true.
- A controlled prop reset updates the native peer without a callback echo.
- Rejected pointer, Space and UIA requests leave the controlled model Off.
- Readonly remains focusable but rejects changes; disabled rejects focus and
  automation.
- Uncontrolled Space/pointer state and small-size pointer input work.
- Label activation runs one async action and rolls back to Off on rejection.
- Remount restores defaults and leaves one live event subscription.

The normal input and track both measured40x24DIP; small measured32x20DIP.
All21recorded input/track snapshots matched in size and position. Physical
pointer assertions required the owned foreground window and owned hit target;
these were not direct handler calls. The peer reports Button with TogglePattern;
this is not full Switch role or screen-reader qualification.

The same binary then passed6/6repeated async rejection trials, bootmvt45a52,
exit0: three interleaved physical track/label pairs, each with exactly one
action, true,false callbacks and native Off. No pre-input model snapshot was
used to trigger rendering. Final read-only snapshots found checked=false and
no loading class; all14input/track geometry snapshots matched. The wrapper
stopped its owned app and released the device/input reservation.

Retained records under research/windows61/:
windy-native-v16-shared-switch.log, windy-v16-shared-os-results.json,
windy-v16-layouts-os-results.json, windy-native-v17-shared-switch.log,
windy-v17-native-exit.json, windy-v17-typecheck.log,
windy-v17-native-task.log, windy-toggle-source-contracts-11-detail.log,
windy-node-compiled-async-state-repro-detail.log,
windy-os-shared-switch-v17.log, windy-v17-shared-os-results.json,
windy-v17-shared-full-console.log, windy-v17-shared-installed-package.json,
windy-os-switch-async-v17.log, windy-v17-async-os-results.json,
windy-v17-async-full-console.log and windy-v17-async-current-boot-console.json.
Temporary drivers are in research/windows61/native-common-flows/. Records are
local ignored evidence; they have not been pushed or published as artifacts.

Public Windows setup, the Octane primitives reference and the release note
describe the bounded input improvement. No recipe or broad component row is
promoted: existing Switch examples informed demand but do not qualify a
Windows consumer workflow. ui:Switch remains pending for full props/Field,
dynamic resize, concurrent actions/disposal, Narrator, visual parity and wider
packaging/version/architecture evidence. No screenshots or visual analysis
were used. Full native/packed tests and package/dependent typechecks remain
deferred under the earlier exact commands; CLI/patches dependent checks also
remain deferred from their prior changes. The persistent task stays active.

Final lightweight review: targeted source formatter/lint and git diff --check
pass; pnpm check:recipes passes. pnpm check:changelog could not run because
this isolated checkout lacks the yaml dependency; it exited1, not a pass. Its
exact command remains deferred until dependencies are available. A syntax-only
supplement using the shared checkout's checker functions parsed27fences across
the two changed guides and release note, using these worktree files explicitly.
It does not replace the unavailable full docs/changelog checks. Semantic impact
inspection cannot resolve the string-registered input or all TSRX export users;
the actual native fixture and VM test evidence above cover the bounded claims.

## Windows CheckboxInput candidate

Next demand assumption: basic checkbox forms and choice lists matter before
niche integrations. The current ControlsDemo/Test evidence specifically uses
Switch; it does not demonstrate a Windows Checkbox app flow. The public
CheckboxInput/CheckboxList surfaces supply the adjacent form requirement.

The unsuffixed Checkbox implementation draws an indicator and toggles on tap.
The Windows candidate retains the indicator registry and shared field props,
and adds a transparent WinUI CheckBox over the measured row. It uses native
CheckBox/TogglePattern semantics, including IsChecked=null for mixed state.
Leaving mixed state requests true regardless of WinUI's own toggle cycle.
The existing Windows SVG leaf remains the indicator prerequisite; no mobile
plugin or new dependency is introduced. No visual parity is claimed.

Fifteen focused controller VM contracts passed via one uncached Turbo
test:checkbox task,2.696s,exit0. Four mixed-state cases supplement the11
guard/lifecycle cases used for Switch. Log:
research/windows61/windy-checkbox-source-contracts-detail.log. Targeted
formatter/lint/whitespace checks pass. These are source contracts, not WinUI
nullable-state, geometry, keyboard or UIA proof.

V18's bounded native graph passed38/38tasks,28cached,7m44.513s,exit0.
Standalone checker emitted no diagnostics; delegated checker retained the same
12diagnostics in11otherfiles, and the existing three MSBuild warnings remain.
A15group nonvisual driver ran
for common input, controlled/uncontrolled state, mixed acceptance/rejection,
readonly/disabled guards, hidden labels, async rollback and remount. Its
geometry oracle compares UIA/input bounds with the measured row, rather than
assuming a fixed row width. Bootmvt4wyeq passed12/15groups,exit1. Native
CheckBox minimums120x32 remained even after replacing its template; actual
input height32 exceeded the24-DIP row. Mixed rejection and readonly mixed
retention also failed. The accepted mixed request, uncontrolled mixed default,
ordinary controlled/uncontrolled input, Tab order, disabled/readonly boolean
guards, hidden label, async label rollback and remount groups passed.
The geometry group stopped at its first failing input; it did not establish
initial native mixed state for the remaining peers.

The16contract candidate clears native MinWidth/MinHeight and enables
IsThreeState only while the model is mixed, retaining binary activation for
ordinary values. Microsoft's [IsChecked documentation](https://learn.microsoft.com/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.controls.primitives.togglebutton.ischecked?view=windows-app-sdk-1.6)
requires IsThreeState=true to report mixed state. No nullable bridge bug was
isolated or claimed. The mock now rejects mixed writes without that flag, and
asserts cleared native minimums and flag transitions. All16contracts pass via
one uncached Turbo task,2.024s,exit0. V19's bounded native graph is running.
No full component qualification is recorded yet; source remains uncommitted.
Records: research/windows61/windy-native-v18-checkbox.log,
windy-v18-native-exit.json, windy-v18-typecheck.log,
windy-v18-native-task.log, windy-os-shared-checkbox-v18.log,
windy-v18-checkbox-os-results.json, windy-v18-checkbox-full-console.log and
windy-checkbox-source-contracts-16.log. The original mismatch is preserved in
Silo feedback_observations with marker windows61-checkbox-v18-minimums-mixed.

The CheckboxList option path remains separate: CheckboxGroup.tsrx imports
./Checkbox.tsrx explicitly, and CheckboxListItem has its own tap-based control.
This standalone CheckboxInput candidate does not establish their Windows
resolution, focus, keyboard or group semantics. Reassess that import prerequisite
before promoting list behavior. The platform-leaves/shared-layout recipes do
not include Windows; no such target is added or relabeled from this fixture.

### V19 retains the native mixed-state failure

V19 graph passed38/38tasks,28cached,7m51.023s,exit0, with the same standalone
checker/delegated diagnostic/MSBuild warning boundaries. Owned MSIX1.0.0.19,
bootmvt5desh, again passed12/15groups,exit1. Native minimums are now zero;
all36recorded Core input/row sizes and positions match. The first seven UIA
peers also matched their measured row geometry (400x24DIP,small400x20DIP).
The peer/state group then failed at the first mixed initial state. Rejected
and readonly mixed state still failed; the other12groups passed. Enabling
IsThreeState alone therefore does not repair the observed native behavior.

The next candidate writes null through
DependencyObject.SetValue(ToggleButton.IsCheckedProperty,null), keeping the
verified direct Boolean setter for ordinary values. Sixteen source contracts
pass through one uncached Turbo task,2.246s,exit0; they now exercise the
dependency-property route. V20's native graph is running with additional
read-only native IsThreeState/IsChecked projection diagnostics. This route is
not a native repair pass yet. No runtime projection defect or null coercion
mechanism has been isolated from the earlier results alone.

Records: research/windows61/windy-native-v19-checkbox.log,
windy-v19-native-exit.json, windy-v19-typecheck.log,
windy-v19-native-task.log, windy-os-shared-checkbox-v19.log,
windy-v19-checkbox-os-results.json, windy-v19-checkbox-full-console.log,
windy-v19-checkbox-current-boot-console.json and
windy-checkbox-dependency-contracts.log. Source remains uncommitted.

### V20 qualifies common CheckboxInput flows

V20 graph passed38/38tasks,28cached,6m27.628s,exit0. The standalone Windows
checker emitted no diagnostics. The delegated native checker still reports
12diagnostics in11otherfiles and the same three MSBuild warnings. This is
the previously authorized bounded graph, not full UI/dependent qualification.

Owned x64 WinUI MSIX1.0.0.20, bootmvt5tay0, passed15/15nonvisual OS groups,
exit0 on windy, OS10.0.26200.0, WinAppSDK1.6.250205002:

- Twelve named native CheckBox/TogglePattern peers initialize with the declared
  Boolean or mixed state and expected enabled flags. Normal/readonly peers are
  focusable; disabled is not.
- Physical Tab preserves order, includes readonly and skips disabled.
- Controlled pointer, Space and UIA requests produce true,false,true; a
  programmatic prop reset changes native state without a callback echo.
- Rejected controlled requests retain Off; readonly and disabled Boolean
  controls reject changes and disabled rejects focus/automation.
- Uncontrolled keyboard/pointer state and small input pointer activation work.
- Label activation runs exactly one async action, reports true,false and
  returns native state to Off on rejection.
- Mixed activation requests true, then follows ordinary Boolean changes.
  Rejected pointer/Space/UIA requests retain mixed and always request true.
  Readonly mixed remains focusable and retains mixed without callbacks.
- An uncontrolled mixed default becomes true then false; hidden label text is
  absent while the explicit accessible name remains keyboard-usable.
- Remount restores defaults and binds one live handler.

All12UIA inputs matched their measured rows:400x24DIP,small400x20DIP, at200%
DPI. All36Core input/row size and position snapshots matched. Stock native
minimums are zero. The diagnostic reads IsChecked=null with IsThreeState=true
for all four mixed models. Boolean getters remain IReference<Boolean> objects
whose Value is false at startup; no object-to-Boolean comparison is used.

Writing null through DependencyObject.SetValue(IsCheckedProperty,null) repairs
the mixed-state checks that failed with direct nullable assignment in v19.
This is a target-local workaround for the pinned Windows preview projection;
its internal boxing/coercion mechanism was not audited. Reassess the route on
runtime upgrades. Sixteen VM contracts protect the adapter, including that
dependency-property route, minimum-size/three-state settings, event guards,
model rejection and callback/native-view lifecycle. Their final uncached
Turbo task passed2.246s,exit0. No new dependency or native runtime patch was
introduced. Existing startup filesystem checks also passed7/7; they do not
expand the earlier filesystem qualification boundary.

Final read-only audit found zero owned app processes and unchanged nativescript.dll
SHA256748D95864AC032DE2D1BB69FEC1E5B2CDD393BAA1671E349AA670160AA66D47C.
The native build/input reservations were released. Existing certificate/trust
was reused. No dependency install, visual analysis, push or merge occurred.

Records under research/windows61/:windy-native-v20-checkbox.log,
windy-v20-native-exit.json, windy-v20-typecheck.log,
windy-v20-native-task.log, windy-os-shared-checkbox-v20.log,
windy-v20-checkbox-os-results.json, windy-v20-checkbox-full-console.log,
windy-v20-checkbox-current-boot-console.json,
windy-v20-checkbox-installed-package.json and
windy-v20-final-package-audit.log. Drivers/fixtures remain in ignored
research/windows61/native-common-flows/. Earlier v18/v19 failures are retained.

Public Windows setup, the Octane primitives reference and a release note now
describe the bounded feature. Twenty-nine changed-guide/release-note fences
parse using the shared checkout's checker functions against these worktree
files explicitly; this is syntax-only evidence. Targeted formatter/lint,
whitespace and pnpm check:recipes pass. No recipe target is promoted: relevant
recipes exclude Windows and no maintained consumer workflow was qualified.
The full docs commands remain absent from this isolated revision, and
check:changelog remains blocked by the missing yaml dependency. No pass is
claimed for any of them.

ui:CheckboxInput stays pending for full Field/prop behavior, resizing,
mixed-state async rejection, concurrent actions/disposal, Narrator/visual
parity, other architectures/versions, unpackaged runs and downstream consumer
packaging. CheckboxList/CheckboxListItem have separate import/input/group gates.
Earlier CLI/patches dependent checks remain deferred; current exact UI/docs
gates remain:

```sh
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run test:native --filter=@octane-xplat/ui
pnpm exec turbo run test:packed --filter=@octane-xplat/ui
pnpm check:docs
pnpm check:doc-examples
pnpm check:changelog
```

The persistent Windows task remains active. Bounded input evidence does not
close the full component or platform-support checkboxes.
